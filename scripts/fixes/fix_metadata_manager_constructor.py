content = open('src/core/metadata/MetadataManager.ts').read()
content = content.replace("// Note: ProviderManager is not stored directly, we use aggregator", "this.aggregator = aggregator;")
open('src/core/metadata/MetadataManager.ts', 'w').write(content)
