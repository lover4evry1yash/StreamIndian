import re

content = open('src/App.tsx').read()
budget = """
const appRenderBudget: RenderBudget = {
  maxCards: 50,
  maxImages: 40,
  maxRenderTimeMs: 100,
  maxMemoryMB: 100
};
"""
content = content.replace("export default function App() {", budget + "\nexport default function App() {")
open('src/App.tsx', 'w').write(content)
