export function normalizeAddonBaseUrl(addonUrl: string): string {
    let baseUrl = addonUrl;
    try { 
        const urlObj = new URL(addonUrl);
        
        // If there is a query string, we REJECT it by throwing an error.
        // Stremio addon protocol expects config in the URL path.
        if (urlObj.search) {
            throw new Error(`Query strings are not supported in Stremio Addon URLs: ${addonUrl}`);
        }

        // Clean up pathname while preserving configuration paths
        let p = urlObj.pathname;
        if (p.endsWith('/')) {
            p = p.slice(0, -1);
        }
        if (p.endsWith('/manifest.json')) {
            p = p.slice(0, -'/manifest.json'.length);
        }
        if (p.endsWith('/')) {
            p = p.slice(0, -1);
        }
        
        urlObj.pathname = p;
        baseUrl = urlObj.toString();
        
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }
    } catch(e) {
        if (e instanceof Error && e.message.includes('Query strings')) {
            throw e;
        }
        baseUrl = addonUrl.replace(/\/manifest\.json$/, '');
        if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl.slice(0, -1);
        }
    }
    
    return baseUrl;
}
