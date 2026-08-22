import { JSON_LD } from '@/content/schema';

/* Server-rendered on purpose. The structured data has to be in the initial HTML
   for crawlers that never run JavaScript — next/script would defer it past that
   point, which is exactly the thing we moved off a client-side SPA to avoid. */

export default function JsonLd() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />;
}
