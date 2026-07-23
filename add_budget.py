import re

content = open('src/App.tsx').read()
content = content.replace("import { container } from './core/ServiceContainer';", "import { container } from './core/ServiceContainer';\nimport { RenderMetrics, RenderBudget } from './core/rendering/RenderMetrics';")

budget = """
const appRenderBudget: RenderBudget = {
  maxCards: 50,
  maxImages: 40,
  maxRenderTimeMs: 100,
  maxMemoryMB: 100
};
"""
content = content.replace("export function App() {", budget + "\nexport function App() {")

effect = """  useEffect(() => {
    loadCatalog();
  }, [selectedLanguage]);"""
  
new_effect = """  useEffect(() => {
    loadCatalog();
    const metrics = container.resolve<RenderMetrics>('RenderMetrics');
    if (metrics) {
      metrics.registerBudget('AppHome', appRenderBudget);
      metrics.validateBudget('AppHome', { cards: catalog.length });
    }
  }, [selectedLanguage, catalog.length]);"""

content = content.replace(effect, new_effect)
open('src/App.tsx', 'w').write(content)
