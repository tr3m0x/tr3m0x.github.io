import { glob } from "astro/loaders"
import { defineCollection, reference } from "astro:content"
import { z } from "astro/zod"

const authors = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./src/content/authors",
  }),
  schema: z.object({
    name: z.string(),
    pronouns: z.string().optional(),
    avatar: z.url().or(z.string().startsWith("/")),
    bio: z.string().optional(),
    mail: z.email().optional(),
    socials: z.record(z.string(), z.url()).optional(),
  }),
})

const blog = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./src/content/blog",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.enum(["writeups", "articles", "cve-analysis"]).optional(),
      description: z.string(),
      date: z.coerce.date(),
      order: z.number().optional(),
      tags: z.array(z.string()).optional(),
      authors: z.array(reference("authors")),
      image: image().optional(),
      draft: z.boolean().optional(),
    }),
})

const cheatsheets = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./src/content/cheatsheets",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    pdf: z.string(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
  }),
})

const projects = defineCollection({
  loader: glob({
    pattern: "**/[^_]*.md",
    base: "./src/content/projects",
  }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      description: z.string(),
      link: z.url(),
      tags: z.array(z.string()).optional(),
      image: image().optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
    }),
})

export const collections = { blog, authors, cheatsheets, projects }
