import { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    // Home page
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 1,
    },
  ];
}
