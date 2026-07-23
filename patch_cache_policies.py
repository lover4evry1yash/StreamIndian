import re

content = open('src/core/storage/types.ts').read()

if "STREAM_RESOLUTIONS" not in content:
    content = content.replace("PROVIDER_RESPONSES = 'PROVIDER_RESPONSES'", "PROVIDER_RESPONSES = 'PROVIDER_RESPONSES',\n  STREAM_RESOLUTIONS = 'STREAM_RESOLUTIONS'")
    
    new_policy = """
  [CachePolicyType.STREAM_RESOLUTIONS]: {
    ttlMs: 4 * 60 * 60 * 1000, // 4 hours
    maxItems: 50,
    persistence: false, // Stream URLs often expire, so memory is usually better, but true is fine for now
    priority: 80,
  },"""
    
    content = content.replace("  [CachePolicyType.PROVIDER_RESPONSES]: {", new_policy + "\n  [CachePolicyType.PROVIDER_RESPONSES]: {")
    open('src/core/storage/types.ts', 'w').write(content)
