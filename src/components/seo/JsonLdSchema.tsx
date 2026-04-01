interface JsonLdSchemaData {
  '@context': 'https://schema.org' | string;
  '@type': string;
  [key: string]: unknown;
}

// Server component — renders JSON-LD inline in initial HTML for crawler visibility.
// dangerouslySetInnerHTML is safe: content is JSON.stringify of static schema objects,
// never user-supplied input.
export default function JsonLdSchema({
  schema,
  nonce,
}: {
  schema: JsonLdSchemaData;
  nonce?: string;
}) {
  const id = `json-ld-${schema['@type'].toLowerCase()}`;
  return (
    <script
      id={id}
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
