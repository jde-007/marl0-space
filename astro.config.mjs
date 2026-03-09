// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  server: { port: 8888 },
  integrations: [mdx()],
  vite: {
    server: {
      allowedHosts: ['dev.marl0.space', 'localhost'],
    },
  },
});
