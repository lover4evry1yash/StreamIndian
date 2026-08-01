import sys

with open('src/design-system/layout/TVRow.tsx', 'r') as f:
    content = f.read()

content = content.replace(
"""    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScrollEnd);
      }
    };""",
"""    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScrollEnd);
      }
      if (scrollState.current.scrollTimeout) {
        clearTimeout(scrollState.current.scrollTimeout);
      }
    };""")

with open('src/design-system/layout/TVRow.tsx', 'w') as f:
    f.write(content)
