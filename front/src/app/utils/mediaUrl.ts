export const resolveMediaUrl = (link?: string | null): string | undefined => {
  if (!link) {
    return undefined;
  }

  if (/^(https?:|blob:|data:)/i.test(link)) {
    return encodeURI(link);
  }

  const normalizedPath = link.startsWith("/") ? link : `/${link}`;
  return `${process.env.NEXT_PUBLIC_BASE_URL}${encodeURI(normalizedPath)}`;
};
