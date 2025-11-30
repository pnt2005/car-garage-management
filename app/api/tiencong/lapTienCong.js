import { prisma } from "@/app/lib/db.js";

/**
 * Lập tiền công mới
 * @param {Object} data
 * @param {string} data.TenTienCong
 * @param {number} data.GiaTienCong
 */
export async function lapTienCong(data) {
  const { TenTienCong, GiaTienCong } = data;

  if (!TenTienCong || TenTienCong.trim() === "") {
    throw new Error("Tên tiền công không được để trống.");
  }
  if (!GiaTienCong || GiaTienCong <= 0) {
    throw new Error("Giá tiền công phải > 0.");
  }

  return await prisma.tIENCONG.create({
    data: { TenTienCong, GiaTienCong },
  });
}