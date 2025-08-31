import { useEffect } from 'react';
import { useTheme } from '../context/theme';

export function useSnipcartTheme() {
  const { isDark } = useTheme();

  useEffect(() => {
    // Function to ensure Snipcart elements have the proper theme class
    const ensureSnipcartTheme = () => {
      // First, ensure the HTML element has the dark class for proper CSS inheritance
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Configure Snipcart theme dynamically
      const snipcartElement = document.getElementById('snipcart');
      if (snipcartElement) {
        if (isDark) {
          snipcartElement.setAttribute('data-config-theme', 'dark');
          snipcartElement.setAttribute('data-config-dark-mode', 'true');
        } else {
          snipcartElement.setAttribute('data-config-theme', 'light');
          snipcartElement.removeAttribute('data-config-dark-mode');
        }
      }

      // Note: Iframe styling removed due to CORS restrictions
      // Payment forms in iframes cannot be styled from the parent page

      // Find all Snipcart elements
      const snipcartElements = document.querySelectorAll('#snipcart, .snipcart-layout, .snipcart-modal, [id^="snipcart"]');
      
      snipcartElements.forEach((element) => {
        if (!element) return;
        
        // Cast to HTMLElement to access style property
        const htmlElement = element as HTMLElement;
        
        // Force a reflow to ensure CSS custom properties are applied
        // This is crucial to override Snipcart's built-in dark mode variables
        const currentDisplay = htmlElement.style.display;
        htmlElement.style.display = 'none';
        htmlElement.offsetHeight; // Trigger reflow
        htmlElement.style.display = currentDisplay || '';
        
        // Additional force reflow for nested elements
        const nestedElements = htmlElement.querySelectorAll('*');
        nestedElements.forEach((nestedElement) => {
          const nestedHtmlElement = nestedElement as HTMLElement;
          if (nestedHtmlElement.offsetHeight) {
            // Just accessing offsetHeight triggers a reflow
            nestedHtmlElement.offsetHeight;
          }
        });
      });
    };

    // Apply theme when component mounts and when theme changes
    ensureSnipcartTheme();

    // Set up a mutation observer to watch for Snipcart elements being added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (element.id && element.id.startsWith('snipcart') || 
                  element.classList.contains('snipcart-layout') ||
                  element.classList.contains('snipcart-modal')) {
                ensureSnipcartTheme();
              }
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, [isDark]);

  return { isDark };
}
