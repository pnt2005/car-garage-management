import { prisma } from "@/app/lib/db.js";
import { xemPhieuSuaChua } from "./xemPhieuSuaChua.js";

/**
 * Lập phiếu sửa chữa cho một xe
 * @param {Object} data
 * @param {string} data.BienSo
 * @param {string} data.NgaySuaChua
 * @param {Array} data.ChiTiet [{ MaPhuTung, SoLuong, MaTienCong, NoiDung }]
 */
export async function lapPhieuSuaChua(data) {
  // -----------------------------
  // 0. VALIDATION
  // -----------------------------
  if (!data || typeof data !== "object") {
    throw new Error("Dữ liệu gửi lên không hợp lệ.");
  }

  const { BienSo, NgaySuaChua, ChiTiet } = data;

  if (!BienSo) throw new Error("Thiếu Biển số.");
  if (!NgaySuaChua) throw new Error("Thiếu Ngày sửa chữa.");
  if (!Array.isArray(ChiTiet) || ChiTiet.length === 0) {
    throw new Error("Chi tiết sửa chữa không hợp lệ.");
  }

  // Validate từng item
  for (const ct of ChiTiet) {
    if (!ct.MaPhuTung || !ct.MaTienCong) {
      throw new Error("Mỗi chi tiết phải chứa MaPhuTung và MaTienCong.");
    }
    if (!ct.NoiDung || ct.NoiDung.trim() === "") {
      throw new Error("Mỗi chi tiết phải có NoiDung.");
    }
    if (!ct.SoLuong || ct.SoLuong <= 0) {
      throw new Error("Số lượng phải >= 1.");
    }
  }

  // -----------------------------
  // DÙNG TRANSACTION
  // -----------------------------
  return await prisma.$transaction(async (tx) => {
    // 1. Tìm hồ sơ tiếp nhận
    const tiepNhan = await tx.tIEPNHANXESUA.findFirst({
      where: { BienSo },
      orderBy: { MaTiepNhanXeSua: "desc" }, // lấy hồ sơ mới nhất
    });

    if (!tiepNhan) {
      throw new Error("Xe này chưa làm thủ tục tiếp nhận sửa chữa.");
    }

    // ------------------------------------------
    // 2. BULK FETCH PHU TUNG + TIEN CONG
    // ------------------------------------------
    const listMaPhuTung = ChiTiet.map((ct) => ct.MaPhuTung);
    const listMaTienCong = ChiTiet.map((ct) => ct.MaTienCong);

    const phuTungs = await tx.pHUTUNG.findMany({
      where: { MaPhuTung: { in: listMaPhuTung } },
    });

    const tienCongs = await tx.tIENCONG.findMany({
      where: { MaTienCong: { in: listMaTienCong } },
    });

    // map để tra nhanh
    const mapPhuTung = Object.fromEntries(
      phuTungs.map((p) => [p.MaPhuTung, p])
    );
    const mapTienCong = Object.fromEntries(
      tienCongs.map((t) => [t.MaTienCong, t])
    );
    // ------------------------------------------
    // 2.5 KIỂM TRA TỒN KHO
    // ------------------------------------------
    for (const ct of ChiTiet) {
      const pt = mapPhuTung[ct.MaPhuTung];

      if (!pt) {
        throw new Error(`Phụ tùng ${ct.MaPhuTung} không tồn tại`);
      }

      if (pt.SoLuongTon < ct.SoLuong) {
        throw new Error(
          `Phụ tùng ${ct.MaPhuTung} không đủ tồn kho (còn ${pt.SoLuongTon}, cần ${ct.SoLuong})`
        );
      }
    }

    // ------------------------------------------
    // 3. TÍNH TOÁN CHI TIẾT + TỔNG TIỀN
    // ------------------------------------------
    let tongThanhTien = 0;
    const chiTietAfterCalc = [];

    for (const ct of ChiTiet) {
      const phuTung = mapPhuTung[ct.MaPhuTung];

      const tienCong = mapTienCong[ct.MaTienCong];
      if (!tienCong) throw new Error(`Tiền công không tồn tại: ${ct.MaTienCong}`);

      const donGia = Number(phuTung.DonGia);
      const giaTienCong = Number(tienCong.GiaTienCong);

      const thanhTien = donGia * ct.SoLuong + giaTienCong;
      tongThanhTien += thanhTien;

      chiTietAfterCalc.push({
        NoiDung: ct.NoiDung,
        SoLuong: ct.SoLuong,
        DonGia: donGia,
        ThanhTien: thanhTien,
        MaPhuTung: ct.MaPhuTung,
        MaTienCong: ct.MaTienCong,
      });
    }

    // ------------------------------------------
    // 4. TẠO PHIẾU SỬA CHỮA (nested create)
    // ------------------------------------------
    const phieu = await tx.pHIEUSUACHUA.create({
      data: {
        NgaySuaChua: new Date(NgaySuaChua),
        TongThanhTien: tongThanhTien,
        MaTiepNhanXeSua: tiepNhan.MaTiepNhanXeSua,
        ChiTietPhieuSuaChua: {
          create: chiTietAfterCalc.map((ct) => ({
            NoiDung: ct.NoiDung,
            SoLuong: ct.SoLuong,
            DonGia: ct.DonGia,
            ThanhTien: ct.ThanhTien,
            MaPhuTung: ct.MaPhuTung,
            MaTienCong: ct.MaTienCong,
          })),
        },
      },
    });

    // ------------------------------------------
    // 5. TRẢ VỀ PHIẾU VỪA TẠO — THEO ID (CHUẨN)
    // ------------------------------------------
    return await xemPhieuSuaChua({ MaPhieuSuaChua: phieu.MaPhieuSuaChua });
  });
}
