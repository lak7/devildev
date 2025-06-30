-- CreateTable
CREATE TABLE "Devlogs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "publishedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "tags" TEXT[],
    "categories" TEXT[],
    "readingTime" INTEGER,
    "excerpt" TEXT,
    "seoTitleTag" TEXT,
    "seoMetaDescription" TEXT,
    "seoCanonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "twitterCard" TEXT,
    "twitterTitle" TEXT,
    "twitterDescription" TEXT,
    "twitterImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devlogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Devlogs_title_key" ON "Devlogs"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Devlogs_slug_key" ON "Devlogs"("slug");
