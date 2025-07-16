import { MetadataRoute } from "next";
import { getDevlogsSlugs } from "../../actions/devlog";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const devlogSlugs = await getDevlogsSlugs();

  const devlogPages = devlogSlugs.map((slug: string) => ({
    url: `${baseUrl}/devlogs/${slug}`,
    lastModified: new Date(),
    changeFrequency: "yearly" as const,
    priority: 1,
  }));

  return [
    // Home page
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 1,
    },
    // Devlogs listing page
    {
      url: `${baseUrl}/devlogs`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    // Individual devlog pages
    ...devlogPages,
  ];
}
