import re

# Fix App.tsx
content = open('src/App.tsx').read()
imports = """import { Play, Info, Star, Film, Sparkles } from 'lucide-react';
import { container } from './core/ServiceContainer';
import { RenderMetrics, RenderBudget } from './core/rendering/RenderMetrics';

const appRenderBudget: RenderBudget = {
  maxCards: 50,
  maxImages: 40,
  maxRenderTimeMs: 100,
  maxMemoryMB: 100
};
"""
content = content.replace("import { Play, Info, Star, Film, Sparkles } from 'lucide-react';", imports)
# Remove the old budget if it was inserted before `export function App()` - wait, the file has `export default function App()`
content = content.replace("export function App() {", "export default function App() {") # just in case
# Wait, I inserted budget in add_budget.py before `export function App()` but it was `export default function App()`
# Let me clean up any broken insertions.
if "\nconst appRenderBudget: RenderBudget =" in content and "import { container }" not in content:
  # it's messy, let's just do regex
  pass

# Just rewrite App.tsx imports cleanly.
content = re.sub(r'const appRenderBudget: RenderBudget = \{.*?\};\n', '', content, flags=re.DOTALL)
content = content.replace("export default function App() {", "export default function App() {")
open('src/App.tsx', 'w').write(content)

# Fix LazyImage.tsx
content = open('src/components/LazyImage.tsx').read()
content = content.replace("priority?: 'high' | 'low';", "priority?: 'high' | 'medium' | 'low';")
content = content.replace("priority = 'low',", "priority = 'low' as 'high' | 'medium' | 'low',")
content = content.replace("priority = 'low' as 'high' | 'low',", "priority = 'low' as 'high' | 'medium' | 'low',")
open('src/components/LazyImage.tsx', 'w').write(content)

# Fix MediaCard.tsx
content = open('src/components/MediaCard.tsx').read()
content = content.replace("export const MediaCard: React.FC<MediaCardProps> = ({ media, onSelect }) => {", "export const MediaCard: React.FC<MediaCardProps> = ({ media, onSelect, index, rowId, isVisible }) => {")
open('src/components/MediaCard.tsx', 'w').write(content)

# Fix MediaRow.tsx
content = open('src/components/MediaRow.tsx').read()
content = content.replace("  onSelectMedia,\n}) => {", "  onSelectMedia,\n  rowId,\n}) => {")
open('src/components/MediaRow.tsx', 'w').write(content)

