import { defineConfig } from 'astro/config';

export default defineConfig({
  // 마크다운 테마
  markdown: {
    shikiConfig: {
      theme: 'catppuccin-frappe',
      // wrap: true, // 코드 줄 자동 줄바꿈
    },
  },
});
