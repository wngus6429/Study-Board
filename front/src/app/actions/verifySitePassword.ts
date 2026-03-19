"use server";

export async function verifySitePassword(password: string) {
  const sitePassword = process.env.SITE_PASSWORD || process.env.NEXT_PUBLIC_SITE_PASSWORD;
  return password === sitePassword;
}
