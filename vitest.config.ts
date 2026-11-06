import {defineConfig} from 'vitest/config';

// Kept apart from vite.config.ts so unit tests run in plain Node without starting the Workers runtime.
export default defineConfig({
  test:{include:['tests/*.test.ts'],environment:'node'}
});
