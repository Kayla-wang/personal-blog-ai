// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

const isPages = process.env.DEPLOY_TARGET === 'pages';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'AI 学习笔记',
  tagline: '理论知识 · 项目实战 · 持续学习',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: isPages ? 'https://kayla-wang.github.io' : 'https://your-domain.com',
  baseUrl: isPages ? '/personal-blog-ai/' : '/',

  organizationName: 'Kayla-wang',
  projectName: 'personal-blog-ai',

  customFields: {
    enableChat: !isPages,
  },

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          routeBasePath: 'notes',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'projects',
        path: 'projects',
        routeBasePath: 'projects',
        sidebarPath: './sidebarsProjects.js',
      },
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      /** @type {any} */
      ({
        hashed: true,
        language: ['en', 'zh'],
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        docsRouteBasePath: ['/notes', '/projects'],
        indexBlog: false,
        indexDocs: true,
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'AI 学习笔记',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: '理论知识',
          },
          {
            to: '/projects',
            label: '项目实战',
            position: 'left',
          },
        ],
      },
      footer: {
        style: 'light',
        copyright: `Copyright © ${new Date().getFullYear()} 学习笔记`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json', 'yaml', 'python', 'java', 'sql'],
      },
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
    }),
};

export default config;
