import { prisma } from '@/app/lib/db.js';

export async function themPhuTung(TenPhuTung, DonGia) {
  if (!TenPhuTung || DonGia === undefined || DonGia === null) {
    throw new Error('Thiếu thông tin bắt buộc');
  }

  const phuTung = await prisma.pHUTUNG.create({
    data: {
      TenPhuTung,
      DonGia: parseFloat(DonGia),
    },
  });

  return phuTung;
}
