import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/rakit", "/privasi", "/ketentuan"],
        disallow: ["/b/", "/api/", "/blokir", "/terkirim"],
      },
    ],
  };
}
