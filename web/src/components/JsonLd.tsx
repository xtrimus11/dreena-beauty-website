// Renders one or more schema.org JSON-LD objects as a <script> tag.
// Search engines and AI answer engines (Google AI Overviews, Perplexity,
// ChatGPT search, etc.) read this directly instead of having to infer
// facts from rendered HTML.
export default function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
