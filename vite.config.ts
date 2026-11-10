import {defineConfig} from 'vite';
import {cloudflare} from '@cloudflare/vite-plugin';

// JSX is compiled by Vite itself. The React plugin's fast refresh injects an inline script, which the CSP blocks.
export default defineConfig({
  plugins:[cloudflare()],
  oxc:{jsx:{runtime:'automatic',importSource:'react'}},
  build:{target:'es2022'}
});
