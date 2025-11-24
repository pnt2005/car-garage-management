import { prisma } from "@/app/lib/db.js";

export async function xemBaoCaoTon(thang) {
  const baoCao = await prisma.bAOCAOTON.findFirst({
    where: { Thang: thang },
    include: {
      ChiTietBaoCaoTon: {
        include: { PhuTung: true },
      }
    },
  });

  if (!baoCao) {
    throw new Error("Báo cáo tồn tháng này chưa có. Vui lòng lập báo cáo.");
  }

  return {
    ChiTietBaoCaoTon: baoCao.ChiTietBaoCaoTon
  };
}
