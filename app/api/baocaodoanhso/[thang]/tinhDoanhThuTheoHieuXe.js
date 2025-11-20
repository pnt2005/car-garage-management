import { prisma } from '@/app/lib/db.js';

export async function tinhDoanhThuTheoHieuXe(thang) {
  const namHienTai = new Date().getFullYear();

  const hieuxes = await prisma.hIEUXE.findMany({
    include: {
      TiepNhanXeSua: {
        where: {
          PhieuSuaChua: {
            some: {
              NgaySuaChua: {
                gte: new Date(namHienTai, thang - 1, 1),
                lt: new Date(namHienTai, thang, 1),
              },
            },
          },
        },
        include: { PhieuSuaChua: true },
      },
    },
  });

  const chiTietBaoCaoDoanhSo = hieuxes.map((hx) => {
    const phieuSuaChuaList = hx.TiepNhanXeSua.flatMap((tn) => tn.PhieuSuaChua);
    const thanhTien = phieuSuaChuaList.reduce((sum, ps) => sum + ps.TongThanhTien, 0);
    return {
      MaHieuXe: hx.MaHieuXe,
      SoLuotSua: phieuSuaChuaList.length,
      ThanhTien: thanhTien,
      TiLe: 0,
      TenHieuXe: hx.TenHieuXe,
    };
  });

  const tongDoanhThu = chiTietBaoCaoDoanhSo.reduce((sum, c) => sum + c.ThanhTien, 0);

  chiTietBaoCaoDoanhSo.forEach((c) => {
    c.TiLe = tongDoanhThu > 0 ? (c.ThanhTien / tongDoanhThu) * 100 : 0;
  });

  return { chiTietBaoCaoDoanhSo, tongDoanhThu };
}