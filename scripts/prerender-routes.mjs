/**
 * Post-build pre-rendering script for SEO.
 *
 * Takes the built dist/index.html and generates route-specific HTML files
 * with correct <title>, <meta description>, Open Graph, Twitter Card, and
 * JSON-LD structured data baked in — so crawlers see real content without JS.
 *
 * Run after `vite build`:  node scripts/prerender-routes.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const SITE_URL = 'https://cognicare.app';

// Route definitions with SEO metadata
const routes = [
  {
    path: '/',
    title: 'CogniCare – Cognitive Health Platform for Autism Care',
    description:
      'CogniCare empowers families, specialists, and organizations with AI-powered tools for autism care management, PECS & TEACCH plans, and real-time progress tracking.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          name: 'CogniCare',
          url: SITE_URL,
          logo: `${SITE_URL}/pwa-512x512.png`,
          description: 'A cognitive health platform for autism care.',
        },
        {
          '@type': 'WebApplication',
          name: 'CogniCare',
          url: SITE_URL,
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          description:
            'Manage organizations, families, and specialized treatment plans with AI-powered insights for autism care.',
        },
      ],
    },
  },
  {
    path: '/admin/login',
    title: 'Admin Login | CogniCare',
    description:
      'Sign in to the CogniCare admin dashboard to manage users, organizations, and platform analytics.',
  },
  {
    path: '/org/login',
    title: 'Organization Login | CogniCare',
    description:
      'Sign in or register your organization on CogniCare to manage staff, families, and autism care programs.',
  },
  {
    path: '/specialist/login',
    title: 'Specialist Login | CogniCare',
    description:
      'Sign in to the CogniCare specialist portal to manage PECS & TEACCH plans, track child progress, and collaborate with families.',
  },
];

// Read the built index.html template
const templatePath = join(DIST, 'index.html');
if (!existsSync(templatePath)) {
  console.error('dist/index.html not found. Run `npm run build` first.');
  process.exit(1);
}
const template = readFileSync(templatePath, 'utf-8');

let generated = 0;

for (const route of routes) {
  let html = template;

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  // Replace or inject meta description
  if (html.includes('name="description"')) {
    html = html.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${route.description}" />`
    );
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${route.description}" />\n  </head>`);
  }

  // Inject Open Graph tags
  const canonical = `${SITE_URL}${route.path === '/' ? '' : route.path}`;
  const ogImage = `${SITE_URL}/pwa-512x512.png`;
  const ogTags = [
    `<meta property="og:site_name" content="CogniCare" />`,
    `<meta property="og:title" content="${route.title}" />`,
    `<meta property="og:description" content="${route.description}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:image:width" content="512" />`,
    `<meta property="og:image:height" content="512" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${route.title}" />`,
    `<meta name="twitter:description" content="${route.description}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<link rel="canonical" href="${canonical}" />`,
  ].join('\n    ');

  // Inject OG tags before </head>
  html = html.replace('</head>', `    ${ogTags}\n  </head>`);

  // Inject JSON-LD if present
  if (route.jsonLd) {
    const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(route.jsonLd)}</script>`;
    html = html.replace('</head>', `    ${jsonLdScript}\n  </head>`);
  }

  // Inject noscript fallback content for crawlers that don't execute JS
  const noscriptContent = `<noscript><h1>${route.title}</h1><p>${route.description}</p></noscript>`;
  html = html.replace('<div id="root"></div>', `<div id="root"></div>\n    ${noscriptContent}`);

  // Write the file
  if (route.path === '/') {
    writeFileSync(join(DIST, 'index.html'), html, 'utf-8');
  } else {
    const dir = join(DIST, route.path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html, 'utf-8');
  }

  generated++;
  console.log(`  ✓ ${route.path}`);
}

console.log(`\nPre-rendered ${generated} routes for SEO.`);
