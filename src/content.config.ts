import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    icon: z.string().optional(),
    tagline: z.string(),
    status: z.string().optional(),
    liveUrl: z.string().url().optional(),
    repoUrl: z.string().url().optional(),
    devOnly: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    order: z.number().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    author: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
});

const capabilities = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/capabilities' }),
  schema: z.object({
    title: z.string(),
    icon: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    order: z.number().optional(),
  }),
});

const reports = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reports' }),
  schema: z.object({
    title: z.string(),
    project: z.string(),
    date: z.coerce.date(),
    author: z.string().optional(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  projects,
  blog,
  capabilities,
  reports,
};
