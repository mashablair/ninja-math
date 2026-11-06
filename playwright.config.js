import {defineConfig,devices} from '@playwright/test';
import {E2E} from './scripts/e2e-server.mjs';

export default defineConfig({
  testDir:'tests/e2e',
  fullyParallel:false,
  workers:1,
  retries:process.env.CI?1:0,
  reporter:process.env.CI?'github':'list',
  use:{baseURL:`http://localhost:${E2E.port}`,trace:'retain-on-failure',timezoneId:'America/New_York'},
  projects:[{name:'ipad',use:{...devices['iPad (gen 7) landscape'],browserName:'chromium'}}],
  webServer:{command:'node scripts/e2e-server.mjs',url:`http://localhost:${E2E.port}/api/state`,reuseExistingServer:false,timeout:120000}
});
