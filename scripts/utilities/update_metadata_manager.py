import re

content = open('src/core/metadata/MetadataManager.ts').read()

content = content.replace("import { ProviderManager, ProviderCapability, IMetadataProvider } from '../providers';",
"import { ProviderManager, ProviderCapability, IMetadataProvider } from '../providers';\nimport { MetadataAggregator } from './MetadataAggregator';")

content = content.replace("  private providerManager: ProviderManager;", "  private aggregator: MetadataAggregator;")

content = content.replace("    this.providerManager = providerManager;", "    // Note: ProviderManager is not stored directly, we use aggregator\n")
content = content.replace(
"providerManager: ProviderManager, \n     repository: MetadataRepository, \n     eventBus: EventBus, \n     logger: Logger",
"aggregator: MetadataAggregator, \n     repository: MetadataRepository, \n     eventBus: EventBus, \n     logger: Logger")
content = content.replace(
"providerManager: ProviderManager, \n    repository: MetadataRepository, \n    eventBus: EventBus, \n    logger: Logger",
"aggregator: MetadataAggregator, \n    repository: MetadataRepository, \n    eventBus: EventBus, \n    logger: Logger")

content = re.sub(
r"const result = await this.providerManager.executeFirstSuccessful<any>\([\s\S]*?\}\n      \);",
"const result = await this.aggregator.getMovie(id);",
content, count=1
)

content = content.replace("if (result.data) {", "if (result) {", 1)
content = content.replace("ValidationLayer.validateMovie(result.data);", "ValidationLayer.validateMovie(result);", 1)

content = re.sub(
r"const result = await this.providerManager.executeFirstSuccessful<any>\([\s\S]*?\}\n      \);",
"const result = await this.aggregator.getSeries(id);",
content, count=1
)
content = content.replace("if (result.data) {", "if (result) {", 1)
content = content.replace("ValidationLayer.validateSeries(result.data);", "ValidationLayer.validateSeries(result);", 1)

content = re.sub(
r"const result = await this.providerManager.executeFirstSuccessful<any>\([\s\S]*?\}\n      \);",
"const result = await this.aggregator.getEpisodes(seriesId, seasonNumber);",
content, count=1
)
content = content.replace("if (result.data && Array.isArray(result.data)) {", "if (result && Array.isArray(result)) {", 1)
content = content.replace("const validated = result.data.map((e: any) => {", "const validated = result.map((e: any) => {", 1)

open('src/core/metadata/MetadataManager.ts', 'w').write(content)
