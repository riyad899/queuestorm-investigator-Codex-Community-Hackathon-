/*
  Warnings:

  - You are about to drop the column `homeBanners` on the `HomeBannerSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "HomeBannerSetting" DROP COLUMN "homeBanners",
ADD COLUMN     "middleBanner" TEXT[],
ADD COLUMN     "sideBanner" TEXT[] DEFAULT ARRAY[]::TEXT[];
