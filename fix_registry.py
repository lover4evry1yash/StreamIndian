import re

content = open('src/core/providers/ProviderRegistry.ts').read()
content = content.replace(
"""      health: {
        status: ProviderHealthStatus.UNKNOWN,
        lastSuccess: 0,
        lastFailure: 0,
        averageResponseTime: 0,
        failureCount: 0,
      }""",
"""      health: {
        status: ProviderHealthStatus.UNKNOWN,
        lastSuccess: 0,
        lastFailure: 0,
        averageResponseTime: 0,
        failureCount: 0,
        successCount: 0,
        timeouts: 0,
      }""")
open('src/core/providers/ProviderRegistry.ts', 'w').write(content)
