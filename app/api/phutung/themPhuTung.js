import { prisma } from '@/app/lib/db.js';

// MaPhuTung is optional; if provided we'll include it in the create data
export async function themPhuTung(TenPhuTung, DonGia, MaPhuTung = null) {
  if (!TenPhuTung || DonGia === undefined || DonGia === null) {
    throw new Error('Thiếu thông tin bắt buộc');
  }

  const data = {
    TenPhuTung,
    DonGia: parseFloat(DonGia),
  };

  if (MaPhuTung !== null && MaPhuTung !== undefined && MaPhuTung !== '') {
    data.MaPhuTung = parseInt(MaPhuTung);
  }

  const phuTung = await prisma.pHUTUNG.create({
    data,
  });

  return phuTung;
}
