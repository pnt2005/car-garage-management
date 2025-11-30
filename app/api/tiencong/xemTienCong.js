import { prisma } from "@/app/lib/db.js";

/**
 * Lấy tất cả tiền công
 * @returns {Promise<Array>}
 */
export async function xemTienCong() {
  return await prisma.tIENCONG.findMany({
    orderBy: { TenTienCong: "asc" },
  });
}
