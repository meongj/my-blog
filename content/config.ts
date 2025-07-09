import { defineCollection, z } from "astro:content";

// Astro에 Markdown 컨텐츠 타입 정의
const posts = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    category: z.string(),
    image: z.string(),
    slug: z.string(),
  }),
});

export const collections = {
  posts,
};
