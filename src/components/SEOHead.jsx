import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'CogniCare';
const DEFAULT_TITLE = 'CogniCare – Cognitive Health Platform for Autism Care';
const DEFAULT_DESCRIPTION =
  'CogniCare empowers families, specialists, and organizations with AI-powered tools for autism care management, PECS & TEACCH plans, and real-time progress tracking.';
const DEFAULT_OG_IMAGE = '/pwa-512x512.png';
const SITE_URL = 'https://cognicare.app'; // Update when domain is finalized

/**
 * Per-page SEO head — renders <title>, Open Graph, Twitter Card, and optional JSON-LD.
 *
 * @param {object}  props
 * @param {string}  [props.title]       Page title (appended with " | CogniCare")
 * @param {string}  [props.description] Meta description (≤160 chars recommended)
 * @param {string}  [props.path]        Canonical path, e.g. "/org/login"
 * @param {string}  [props.ogImage]     Open Graph image URL
 * @param {string}  [props.ogType]      Open Graph type (default "website")
 * @param {boolean} [props.noindex]     Add noindex,nofollow (for dashboard pages)
 * @param {object}  [props.jsonLd]      Schema.org JSON-LD object
 */
export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonical = `${SITE_URL}${path}`;
  const absoluteOgImage = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={absoluteOgImage} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="fr_FR" />
      <meta property="og:locale:alternate" content="ar_TN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteOgImage} />

      {/* Schema.org JSON-LD */}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
