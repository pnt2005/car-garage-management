import { prisma } from "@/app/lib/db.js";
import { xemBaoCaoTon } from "./xemBaoCaoTon.js";

export async function lapBaoCaoTon(thang) {
  const nam = new Date().getFullYear();

  // Tính chi tiết báo cáo tồn
  const phuTungs = await prisma.pHUTUNG.findMany();
  const chiTietBaoCaoTon = [];

  for (const pt of phuTungs) {
    // Tồn đầu = tồn cuối tháng trước
    let tonDau = 0;
    if (thang > 1) {
      const baoCaoThangTruoc = await prisma.bAOCAOTON.findFirst({
        where: { Thang: thang - 1 },
        include: { ChiTietBaoCaoTon: true },
      });
      const ctTruoc = baoCaoThangTruoc?.ChiTietBaoCaoTon.find(
        (ct) => ct.MaPhuTung === pt.MaPhuTung
      );
      tonDau = ctTruoc?.TonCuoi ?? 0;
    }

    // Số lượng nhập
    const nhap = await prisma.cHITIETNHAPPHUTUNG.aggregate({
      where: {
        MaPhuTung: pt.MaPhuTung,
        NhapPhuTung: {
          NgayNhap: {
            gte: new Date(nam, thang - 1, 1),
            lt: new Date(nam, thang, 1),
          },
        },
      },
      _sum: { SoLuong: true },
    });
    const nhapSL = nhap._sum.SoLuong || 0;

    // Số lượng xuất
    const xuat = await prisma.cHITIETPHIEUSUACHUA.aggregate({
      where: {
        MaPhuTung: pt.MaPhuTung,
        PhieuSuaChua: {
          NgaySuaChua: {
            gte: new Date(nam, thang - 1, 1),
            lt: new Date(nam, thang, 1),
          },
        },
      },
      _sum: { SoLuong: true },
    });
    const xuatSL = xuat._sum.SoLuong || 0;

    const tonCuoi = tonDau + nhapSL - xuatSL;

    chiTietBaoCaoTon.push({
      MaPhuTung: pt.MaPhuTung,
      TonDau: tonDau,
      PhatSinh: nhapSL - xuatSL,
      TonCuoi: tonCuoi,
    });
  }

  // Xóa báo cáo tồn cũ nếu có
  await prisma.cHITIETBAOCAOTON.deleteMany({
    where: { BaoCaoTon: { Thang: thang } },
  });
  await prisma.bAOCAOTON.deleteMany({ where: { Thang: thang } });

  // Tạo báo cáo tồn mới
  await prisma.bAOCAOTON.create({
    data: {
      Thang: thang,
      ChiTietBaoCaoTon: {
        create: chiTietBaoCaoTon.map((c) => ({
          MaPhuTung: c.MaPhuTung,
          TonDau: c.TonDau,
          PhatSinh: c.PhatSinh,
          TonCuoi: c.TonCuoi,
        })),
      },
    },
    include: { ChiTietBaoCaoTon: true },
  });

  // Trả về báo cáo hiện có
  return xemBaoCaoTon(thang);
}
