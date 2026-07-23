import re

content = open('src/components/VirtualCarousel.tsx').read()
content = content.replace("const [scrollLeft, setScrollLeft] = useState(0);", "const [scrollLeft, setScrollLeft] = useState(0);\n  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);")

# Update handleScroll and add handleFocus
handlers = """  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollLeft(containerRef.current.scrollLeft);
    }
  }, []);

  const handleFocus = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const indexStr = target.getAttribute('data-carousel-index');
    if (indexStr !== null) {
      setFocusedIndex(parseInt(indexStr, 10));
    } else {
      // Try finding a parent with data-carousel-index
      const parent = target.closest('[data-carousel-index]');
      if (parent) {
        setFocusedIndex(parseInt(parent.getAttribute('data-carousel-index') || '0', 10));
      }
    }
  }, []);"""
content = content.replace("""  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollLeft(containerRef.current.scrollLeft);
    }
  }, []);""", handlers)

content = content.replace("onScroll={handleScroll}", "onScroll={handleScroll}\n      onFocusCapture={handleFocus}")

# Update virtualization logic
old_logic = """  const startIndex = Math.max(0, Math.floor(scrollLeft / totalItemWidth) - overscan);
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);"""

new_logic = """  // Calculate bounds based on scroll position OR focused index
  let baseIndex = Math.max(0, Math.floor(scrollLeft / totalItemWidth));
  if (focusedIndex !== null) {
    // Ensure focused item is always within the reliable rendered window
    if (focusedIndex < baseIndex) baseIndex = focusedIndex;
    if (focusedIndex > baseIndex + visibleCount - 1) baseIndex = focusedIndex - visibleCount + 1;
  }
  
  const startIndex = Math.max(0, baseIndex - overscan);
  const endIndex = Math.min(items.length - 1, baseIndex + visibleCount + overscan * 2);"""
content = content.replace(old_logic, new_logic)

# Add data-carousel-index to the wrapper div
wrapper_old = """          <div
            key={index}
            className="absolute top-0"
            style={{ 
              left: `${index * totalItemWidth}px`, 
              width: `${itemWidth}px`,
              height: `${itemHeight}px`
            }}
          >"""
wrapper_new = """          <div
            key={index}
            className="absolute top-0"
            style={{ 
              left: `${index * totalItemWidth}px`, 
              width: `${itemWidth}px`,
              height: `${itemHeight}px`
            }}
            data-carousel-index={index}
          >"""
content = content.replace(wrapper_old, wrapper_new)

open('src/components/VirtualCarousel.tsx', 'w').write(content)
