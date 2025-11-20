import { prisma } from '@/app/lib/db.js';

export async function tinhBaoCaoTon(thang) {
  const nam = new Date().getFullYear();
  const phuTungs = await prisma.pHUTUNG.findMany();
  if (!phuTungs || phuTungs.length === 0) {
    return { chiTietBaoCaoTon: [] };  
  }
  const chiTietBaoCaoTon = [];

  for (const pt of phuTungs) {
    // Tồn đầu = tồn hiện tại - nhập + xuất trong tháng
    let tonDau = 0;
    if (thang > 1) {
      const baoCaoThangTruoc = await prisma.bAOCAOTON.findFirst({
        where: { Thang: thang - 1 },
        include: { ChiTietBaoCaoTon: true },
      });

      if (baoCaoThangTruoc?.ChiTietBaoCaoTon) {
        const chiTietTruoc = baoCaoThangTruoc.ChiTietBaoCaoTon.find(
          ct => ct.MaPhuTung === pt.MaPhuTung
        );
        tonDau = chiTietTruoc?.TonCuoi ?? 0;
      }
    }

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
    console.log(nhap);
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

    const nhapSL = nhap._sum.SoLuong || 0;
    const xuatSL = xuat._sum.SoLuong || 0;
    const tonCuoi = tonDau + nhapSL - xuatSL;

    chiTietBaoCaoTon.push({
      MaPhuTung: pt.MaPhuTung,
      TonDau: tonDau,
      PhatSinh: nhapSL - xuatSL,
      TonCuoi: tonCuoi,
      TenPhuTung: pt.TenPhuTung
    });
  }

  return { chiTietBaoCaoTon };
}
