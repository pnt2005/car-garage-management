import { prisma } from '@/app/lib/db.js';
import { tinhBaoCaoTon } from "./tinhBaoCaoTon.js";

export async function lapBaoCaoTon(thang) {
  const { chiTietBaoCaoTon } = await tinhBaoCaoTon(thang);

  const existing = await prisma.bAOCAOTON.findUnique({
    where: { Thang: thang },
    include: { ChiTietBaoCaoTon: true },
  });

  if (existing) {
    // Xóa chi tiết cũ
    await prisma.cHITIETBAOCAOTON.deleteMany({
      where: { MaBaoCaoTon: existing.MaBaoCaoTon },
    });

    // Cập nhật
    return prisma.bAOCAOTON.update({
      where: { MaBaoCaoTon: existing.MaBaoCaoTon },
      data: {
        ChiTietBaoCaoTon: {
          create: chiTietBaoCaoTon,
        },
      },
    });
  }

  // Tạo mới
  return prisma.bAOCAOTON.create({
    data: {
      Thang: thang,
      ChiTietBaoCaoTon: {
        create: chiTietBaoCaoTon,
      },
    },
  });
}
