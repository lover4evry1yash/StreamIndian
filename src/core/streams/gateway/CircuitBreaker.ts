export enum CircuitState {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN'
}

export class CircuitBreaker {
    private failureThreshold: number;
    private cooldownMs: number;
    private state: CircuitState = CircuitState.CLOSED;
    private consecutiveFailures = 0;
    private nextAttempt = 0;

    constructor(failureThreshold = 3, cooldownMs = 300000) {
        this.failureThreshold = failureThreshold;
        this.cooldownMs = cooldownMs;
    }

    public async execute<T>(task: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() > this.nextAttempt) {
                this.state = CircuitState.HALF_OPEN;
            } else {
                throw new Error('Circuit Breaker is OPEN');
            }
        }

        try {
            const result = await task();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess() {
        this.consecutiveFailures = 0;
        this.state = CircuitState.CLOSED;
    }

    private onFailure() {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.failureThreshold) {
            this.trip();
        }
    }

    public trip() {
        this.state = CircuitState.OPEN;
        this.nextAttempt = Date.now() + this.cooldownMs;
    }

    public reset() {
        this.state = CircuitState.CLOSED;
        this.consecutiveFailures = 0;
        this.nextAttempt = 0;
    }

    public getState(): CircuitState {
        return this.state;
    }
}
