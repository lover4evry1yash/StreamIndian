import re

content = open('src/core/providers/types.ts').read()

new_errors = """export enum ProviderErrorType {
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  RATE_LIMIT = 'RATE_LIMIT',
  PROVIDER_FAILURE = 'PROVIDER_FAILURE',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  UNKNOWN = 'UNKNOWN',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  MERGE_CONFLICT = 'MERGE_CONFLICT',
  CAPABILITY_UNAVAILABLE = 'CAPABILITY_UNAVAILABLE',
  UNKNOWN_PROVIDER = 'UNKNOWN_PROVIDER'
}"""

content = re.sub(r'export enum ProviderErrorType \{[^}]+\}', new_errors, content)
open('src/core/providers/types.ts', 'w').write(content)
