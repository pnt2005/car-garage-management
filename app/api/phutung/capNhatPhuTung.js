import { prisma } from '@/app/lib/db.js';

export async function capNhatPhuTung(MaPhuTung, TenPhuTung, DonGia) {
  if (!MaPhuTung || !TenPhuTung || DonGia === undefined || DonGia === null) {
    throw new Error("Thiếu thông tin bắt buộc");
  }

  const phuTung = await prisma.pHUTUNG.update({
    where: { MaPhuTung: parseInt(MaPhuTung) },
    data: {
      TenPhuTung,
      DonGia: parseFloat(DonGia),
    },
  });

  return phuTung;
}
