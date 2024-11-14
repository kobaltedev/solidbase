import { vitePlugin as OGPlugin } from "@solid-mediakit/og/unplugin";
import { defineConfig } from "@solidjs/start/config";

import { createWithSolidBase, defineTheme } from "../src/config";
import defaultTheme from "../src/default-theme";

const theme = defineTheme({
  componentsPath: import.meta.resolve("./src/solidbase-theme"),
  extends: defaultTheme,
});

export default defineConfig(
  createWithSolidBase(theme)(
    {
      ssr: true,
      server: {
        prerender: {
          crawlLinks: true,
        },
      },
      vite: {
        plugins: [OGPlugin()],
      },
    },
    {
      title: "SolidBase",
      description: "Fully featured, fully customisable static site generation for SolidStart",
      titleTemplate: ":title – SolidBase",
      issueAutolink: "https://github.com/kobaltedev/solidbase/issues/:issue",
      lang: "en",
      locales: {
        fr: {
          label: "French",
          themeConfig: {
            nav: [
              {
                text: "Guide",
                link: "/guide",
              },
              {
                text: "Référence",
                link: "/reference",
              },
            ],
            sidebar: {
              "/guide": {
                items: [
                  {
                    title: "Aperçu",
                    collapsed: false,
                    items: [
                      {
                        title: "Introduction",
                        link: "/",
                      },
                      {
                        title: "Qu'est-ce que SolidBase ?",
                        link: "/about",
                      },
                    ],
                  },
                  {
                    title: "Fonctionnalités",
                    collapsed: false,
                    items: [
                      {
                        title: "MDX",
                        link: "/about",
                      },
                      {
                        title: "Copie de code",
                        link: "/about",
                      },
                      {
                        title: "Bons styles",
                        link: "/about",
                      },
                      {
                        title: "Équipe cool 8)",
                        link: "/about",
                      },
                      {
                        title: "CLI",
                        link: "/about",
                      },
                    ],
                  },
                ],
              },
              "/reference": {
                items: [
                  {
                    title: "Référence",
                    collapsed: false,
                    items: [],
                  },
                ],
              },
            },
          },
        },
      },
      editPath:
        "https://github.com/kobaltedev/solidbase/edit/main/docs/src/routes/:path",
      themeConfig: {
        socialLinks: {
          github: "https://github.com/kobaltedev/solidbase",
          discord: "https://discord.com/invite/solidjs",
        },
        nav: [
          {
            text: "Guide",
            link: "/guide",
          },
          {
            text: "Reference",
            link: "/reference",
          },
        ],
        sidebar: {
          "/guide": {
            items: [
              {
                title: "Overview",
                collapsed: false,
                items: [
                  {
                    title: "Introduction",
                    link: "/",
                  },
                  {
                    title: "What is SolidBase?",
                    link: "/about",
                  },
                  {
                    title: "Getting Started",
                    link: "/getting-started",
                  },
                  {
                    title: "What are we missing?",
                    link: "/dave",
                  },
                ],
              },
              {
                title: "Features",
                collapsed: false,
                items: [
                  {
                    title: "MDX",
                    link: "/md-extensions",
                  },
                  {
                    title: "Good styles",
                    link: "/customization",
                  },
                  {
                    title: "Cool team 8)",
                    link: "/about",
                  },
                  {
                    title: "Dev",
                    link: "/dev",
                  },
                ],
              },
            ],
          },
          "/reference": {
            items: [
              {
                title: "Reference",
                collapsed: false,
                items: [],
              },
            ],
          },
        },
      },
    },
  ),
);
