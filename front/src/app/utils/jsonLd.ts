// JSON escaping alone does not prevent HTML from closing a script element.
export const serializeJsonLd = (value: unknown): string =>
  JSON.stringify(value).replace(/</g, "\\u003c");
