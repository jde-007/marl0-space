import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    excerpt: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    icon: z.string(),
    tagline: z.string(),
    status: z.string(),
    liveUrl: z.string().optional(),
    devOnly: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    order: z.number().optional(),
  }),
});

// Capabilities: what Dave can actually do (human + AI + infrastructure)
const capabilities = defineCollection({
  loader: glob({ base: './src/content/capabilities', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['build', 'lead', 'operate', 'think', 'amplify']),
    icon: z.string(),
    proof: z.array(z.string()).optional(), // links to experiences that prove this
    order: z.number().optional(),
  }),
});

// Experiences: roles, projects, accomplishments (the "resume" but richer)
const experiences = defineCollection({
  loader: glob({ base: './src/content/experiences', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    org: z.string(),
    role: z.string(),
    period: z.string(),
    tags: z.array(z.string()).optional(),
    capabilities: z.array(z.string()).optional(), // which capabilities this demonstrates
    order: z.number().optional(),
  }),
});

// Learnings: distilled insights from experience (teased out via interviews over time)
const learnings = defineCollection({
  loader: glob({ base: './src/content/learnings', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
    source: z.string(), // what experience or event this came from
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = { blog, projects, capabilities, experiences, learnings };
