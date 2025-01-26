import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "notes",
  description: "Site with notes about what I want to remember.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Examples", link: "/markdown-examples" },
    ],

    sidebar: [
      {
        text: "Examples",
        items: [
          { text: "Markdown Examples", link: "/markdown-examples" },
          { text: "Runtime API Examples", link: "/api-examples" },
          { text: "Golang", link: "/golang" },
          { text: "Typescript", link: "/typescript" },
          { text: "Javascript", link: "/javascript" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/ukibbb" }],
  },
});
