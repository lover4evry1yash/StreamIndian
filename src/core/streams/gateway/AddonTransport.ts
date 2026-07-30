export interface AddonTransport {
    request(url: string, options?: RequestInit): Promise<Response>;
}

export class DirectAddonTransport implements AddonTransport {
    public async request(url: string, options?: RequestInit): Promise<Response> {
        return fetch(url, options);
    }
}

export class ProxyAddonTransport implements AddonTransport {
    public async request(url: string, options?: RequestInit): Promise<Response> {
        // We use a development proxy endpoint to avoid CORS / IP blocking issues in AI Studio
        const proxyUrl = `/api/gateway/proxy?url=${encodeURIComponent(url)}`;
        return fetch(proxyUrl, options);
    }
}
