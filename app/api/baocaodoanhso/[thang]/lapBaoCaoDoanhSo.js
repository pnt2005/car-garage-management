import { prisma } from "@/app/lib/db.js";
import { xemBaoCaoDoanhSo } from "./xemBaoCaoDoanhSo.js";

export async function lapBaoCaoDoanhSo(thang) {
  const nam = new Date().getFullYear();

  const hieuxes = await prisma.hIEUXE.findMany({
    include: {
      TiepNhanXeSua: {
        include: {
          PhieuSuaChua: {
            where: {
              NgaySuaChua: {
                gte: new Date(nam, thang - 1, 1),
                lt: new Date(nam, thang, 1),
              },
            },
          },
        },
      },
    },
  });

  const chiTiet = hieuxes.map((hx) => {
    const list = hx.TiepNhanXeSua.flatMap((tn) => tn.PhieuSuaChua);
    const thanhTien = list.reduce((s, p) => s + p.TongThanhTien, 0);

    return {
      MaHieuXe: hx.MaHieuXe,
      SoLuotSua: list.length,
      DoanhThu: thanhTien,
    };
  });

  const tong = chiTiet.reduce((s, c) => s + c.DoanhThu, 0);

  chiTiet.forEach((c) => {
    c.TiLe = tong > 0 ? (c.DoanhThu / tong) * 100 : 0;
  });

  // Xóa báo cáo cũ (nếu tồn tại)
  await prisma.cHITIETBAOCAODOANHSO.deleteMany({
    where: { BaoCaoDoanhSo: { Thang: thang } },
  });

  await prisma.bAOCAODOANHSO.deleteMany({
    where: { Thang: thang },
  });

  // Lưu báo cáo mới
  await prisma.bAOCAODOANHSO.create({
    data: {
      Thang: thang,
      TongDoanhThu: tong,
      ChiTietBaoCaoDoanhSo: {
        create: chiTiet.map((c) => ({
          MaHieuXe: c.MaHieuXe,
          SoLuotSua: c.SoLuotSua,
          ThanhTien: c.DoanhThu,
          TiLe: c.TiLe,
        })),
      },
    },
    include: {
      ChiTietBaoCaoDoanhSo: true,
    },
  });

  return xemBaoCaoDoanhSo(thang);
}
