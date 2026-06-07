import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom Babel plugin to inject data-locator for debugging
const addLocatorsPlugin = (babel) => {
  const { types: t } = babel;
  return {
    visitor: {
      JSXOpeningElement(path, state) {
        if (!state.file.opts.filename || state.file.opts.filename.includes('node_modules')) return;
        
        // Skip Fragments
        if (path.node.name.type === 'JSXIdentifier' && path.node.name.name === 'Fragment') return;

        // Ensure we only add it to standard lowercase DOM elements, so it ends up in the HTML.
        if (path.node.name.type === 'JSXIdentifier') {
          const tagName = path.node.name.name;
          if (/^[a-z]/.test(tagName)) {
            const filename = state.file.opts.filename;
            const basename = filename.split('/').pop().split('\\').pop(); // Handle both OS paths
            const line = path.node.loc ? path.node.loc.start.line : '';
            const locator = `${basename}${line ? ':' + line : ''}`;
            
            const hasLocator = path.node.attributes.some(
              attr => t.isJSXAttribute(attr) && attr.name.name === 'data-locator'
            );
            
            if (!hasLocator) {
              path.node.attributes.push(
                t.jsxAttribute(
                  t.jsxIdentifier('data-locator'),
                  t.stringLiteral(locator)
                )
              );
            }
          }
        }
      }
    }
  };
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  return {
    plugins: [
      react({
        babel: {
          plugins: isDev ? [addLocatorsPlugin] : []
        }
      })
    ],
  };
})
