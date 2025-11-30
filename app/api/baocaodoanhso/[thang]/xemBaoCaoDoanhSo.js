import { prisma } from "@/app/lib/db.js";

export async function xemBaoCaoDoanhSo(thang) {
  const baoCao = await prisma.bAOCAODOANHSO.findFirst({
    where: { Thang: thang },
    include: {
      ChiTietBaoCaoDoanhSo: {
        include: { HieuXe: true },
      },
    },
  });

  if (!baoCao) {
    throw new Error("Báo cáo tháng này chưa có. Vui lòng lập báo cáo.");
  }

  return {
    ChiTietBaoCaoDoanhSo: baoCao.ChiTietBaoCaoDoanhSo,
    TongDoanhThu: baoCao.TongDoanhThu,
  };
}
