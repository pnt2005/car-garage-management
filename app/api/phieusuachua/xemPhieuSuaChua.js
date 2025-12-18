import { prisma } from "@/app/lib/db.js";

/**
 * @param {string} bienSo - Biển số xe
 * @returns {Promise<Array>} Danh sách phiếu sửa chữa
 */
export async function xemPhieuSuaChua(bienSo) {
  const phieuList = await prisma.pHIEUSUACHUA.findMany({
    where: { TiepNhanXeSua: { BienSo: bienSo } },
    include: {
      TiepNhanXeSua: {
        include: {
          ChuXe: { select: { TenChuXe: true, DienThoai: true, Email: true } },
          HieuXe: { select: { TenHieuXe: true } },
        },
      },
      ChiTietPhieuSuaChua: {
        include: {
          PhuTung: { select: { TenPhuTung: true, DonGia: true } },
          TienCong: { select: { GiaTienCong: true } },
        },
      },
    },
    orderBy: { NgaySuaChua: "desc" },
  });

  if (!phieuList || phieuList.length === 0) {
    throw new Error("Xe này chưa có phiếu sửa chữa nào.");
  }

  return phieuList.map((phieu) => ({
    NgaySuaChua: phieu.NgaySuaChua, // thuộc phiếu
    ChuXe: phieu.TiepNhanXeSua.ChuXe,
    HieuXe: phieu.TiepNhanXeSua.HieuXe,
    BienSo: phieu.TiepNhanXeSua.BienSo,
    TongThanhTien: phieu.TongThanhTien, // tổng tiền phiếu
    ChiTietPhieuSuaChua: phieu.ChiTietPhieuSuaChua.map((ct) => ({
      TenPhuTung: ct.PhuTung.TenPhuTung,
      SoLuong: ct.SoLuong,
      DonGia: ct.PhuTung.DonGia,
      GiaTienCong: ct.TienCong.GiaTienCong,
      ThanhTien: ct.ThanhTien,
      NoiDung: ct.NoiDung,
    })),
  }));
}
