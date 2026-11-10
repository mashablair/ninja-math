import {defineConfig} from 'vitest/config';

// Kept apart from vite.config.ts so unit tests run in plain Node without starting the Workers runtime.
export default defineConfig({
  // Cloudflare's build machine runs these before each deploy and can be slow to load the validation code the first time.
  test:{include:['tests/*.test.ts'],environment:'node',testTimeout:30000}
});
