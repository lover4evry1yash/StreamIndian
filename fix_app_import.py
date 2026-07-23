content = open('src/App.tsx').read()
content = "import { StreamSelectionView } from './components/StreamSelectionView';\n" + content
open('src/App.tsx', 'w').write(content)
