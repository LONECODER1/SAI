const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', 'lucide-react', 'dist', 'cjs', 'lucide-react.js');

if (fs.existsSync(target)) {
  let content = fs.readFileSync(target, 'utf8');
  let changed = false;

  if (content.includes('const LucideContext = react.createContext({});')) {
    content = content.replace(
      'const LucideContext = react.createContext({});',
      'const LucideContext = typeof react.createContext === "function" ? react.createContext({}) : null;'
    );
    changed = true;
  }

  if (content.includes('const useLucideContext = () => react.useContext(LucideContext);')) {
    content = content.replace(
      'const useLucideContext = () => react.useContext(LucideContext);',
      'const useLucideContext = () => (typeof react.useContext === "function" && LucideContext) ? react.useContext(LucideContext) : {};'
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(target, content, 'utf8');
    console.log('[patch-lucide] Successfully patched lucide-react for React 19 RSC compatibility.');
  } else {
    console.log('[patch-lucide] lucide-react already patched.');
  }
} else {
  console.log('[patch-lucide] lucide-react target file not found.');
}
