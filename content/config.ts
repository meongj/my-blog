import { defineCollection, z, getCollection } from 'astro:content';

// Astro에 Markdown 컨텐츠 타입 정의
export const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    section: z.string(),
    category: z.string(),
    image: z.string(),
    slug: z.string(),
  }),
});

export const collections = {
  posts,
};

// markdown 파일 불러오기
export const allPosts = await getCollection('posts');
// export const allSections = await getCollection('sections');
export const sections = [...new Set(allPosts.map((post) => post.data.section))];
