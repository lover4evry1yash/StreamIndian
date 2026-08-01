import sys

with open('src/core/rendering/RenderMetrics.ts', 'r') as f:
    content = f.read()

content = content.replace(
"""  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled && !this.observer && typeof PerformanceObserver !== 'undefined') {""",
"""  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled && this.observer) {
        this.observer.disconnect();
        this.observer = null;
    }
    if (enabled && !this.observer && typeof PerformanceObserver !== 'undefined') {""")

with open('src/core/rendering/RenderMetrics.ts', 'w') as f:
    f.write(content)
