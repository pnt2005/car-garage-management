import { prisma } from '@/app/lib/db.js';
import { tinhDoanhThuTheoHieuXe } from './tinhDoanhThuTheoHieuXe.js';

export async function lapBaoCao(thang) {
  const { chiTietBaoCaoDoanhSo, tongDoanhThu } = await tinhDoanhThuTheoHieuXe(thang);

  const existingBaoCao = await prisma.bAOCAODOANHSO.findUnique({
    where: { Thang: thang },
    include: { ChiTietBaoCaoDoanhSo: true },
  });

  if (existingBaoCao) {
    await prisma.cHITIETBAOCAODOANHSO.deleteMany({
      where: { MaBaoCaoDoanhSo: existingBaoCao.MaBaoCaoDoanhSo },
    });

    return prisma.bAOCAODOANHSO.update({
      where: { MaBaoCaoDoanhSo: existingBaoCao.MaBaoCaoDoanhSo },
      data: {
        TongDoanhThu: tongDoanhThu,
        ChiTietBaoCaoDoanhSo: { create: chiTietBaoCaoDoanhSo },
      },
    });
  } else {
    return prisma.bAOCAODOANHSO.create({
      data: {
        Thang: thang,
        TongDoanhThu: tongDoanhThu,
        ChiTietBaoCaoDoanhSo: { create: chiTietBaoCaoDoanhSo },
      },
    });
  }
}
