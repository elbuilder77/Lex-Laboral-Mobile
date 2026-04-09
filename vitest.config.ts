import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// @ts-ignore - Ignore type conflicts between vite and vitest config objects
export default mergeConfig(viteConfig({ mode: 'test', command: 'serve' }), defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    // @ts-ignore - Vitest types might not correctly map this property in all setups
    environmentMatchGlobs: [
      ['security_rules_test_firestore/**', 'node'],
    ],
  },
}));