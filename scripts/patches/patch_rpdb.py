content = open('src/core/providers/rpdb/RPDBProvider.ts').read()
content = content.replace("export class RPDBProvider implements IProvider {", "import { IArtworkProvider } from '../types';\nexport class RPDBProvider implements IArtworkProvider {")
open('src/core/providers/rpdb/RPDBProvider.ts', 'w').write(content)
