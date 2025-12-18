import { prisma } from "@/app/lib/db.js";

/**
 * Lập phiếu sửa chữa cho một xe
 * @param {Object} data
 * @param {number} data.MaTiepNhanXeSua - Mã tiếp nhận xe sửa (thay vì BienSo)
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

  const { MaTiepNhanXeSua, NgaySuaChua, ChiTiet } = data;

  if (!MaTiepNhanXeSua) throw new Error("Thiếu Mã tiếp nhận xe sửa.");
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
    const tiepNhan = await tx.tIEPNHANXESUA.findUnique({
      where: { MaTiepNhanXeSua: Number(MaTiepNhanXeSua) },
    });

    if (!tiepNhan) {
      throw new Error("Không tìm thấy hồ sơ tiếp nhận xe sửa.");
    }

    // ------------------------------------------
    // 2. BULK FETCH PHU TUNG + TIEN CONG
    // ------------------------------------------
    const listMaPhuTung = ChiTiet.map((ct) => Number(ct.MaPhuTung));
    const listMaTienCong = ChiTiet.map((ct) => Number(ct.MaTienCong));

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
      const pt = mapPhuTung[Number(ct.MaPhuTung)];

      if (!pt) {
        throw new Error(`Phụ tùng ${ct.MaPhuTung} không tồn tại`);
      }

      if (pt.SoLuongTon < ct.SoLuong) {
        throw new Error(
          `Phụ tùng "${pt.TenPhuTung}" không đủ tồn kho (còn ${pt.SoLuongTon}, cần ${ct.SoLuong})`
        );
      }
    }

    for (const ct of ChiTiet) {
      await tx.pHUTUNG.update({
        where: { MaPhuTung: Number(ct.MaPhuTung) },
        data: {
          SoLuongTon: {
            decrement: ct.SoLuong // Giảm số lượng tồn đi đúng bằng số lượng đã dùng
          }
        }
      });
    }

    // ------------------------------------------
    // 3. TÍNH TOÁN CHI TIẾT + TỔNG TIỀN
    // ------------------------------------------
    let tongThanhTien = 0;
    const chiTietAfterCalc = [];

    for (const ct of ChiTiet) {
      const phuTung = mapPhuTung[Number(ct.MaPhuTung)];
      const tienCong = mapTienCong[Number(ct.MaTienCong)];
      
      if (!tienCong) throw new Error(`Tiền công không tồn tại: ${ct.MaTienCong}`);

      const donGia = Number(phuTung.DonGia);
      const giaTienCong = Number(tienCong.GiaTienCong);

      const thanhTien = donGia * ct.SoLuong + giaTienCong;
      tongThanhTien += thanhTien;

      chiTietAfterCalc.push({
        NoiDung: ct.NoiDung,
        SoLuong: ct.SoLuong,
        ThanhTien: thanhTien,
        MaPhuTung: Number(ct.MaPhuTung),
        MaTienCong: Number(ct.MaTienCong),
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
            ThanhTien: ct.ThanhTien,
            MaPhuTung: ct.MaPhuTung,
            MaTienCong: ct.MaTienCong,
          })),
        },
      },
      include: {
        TiepNhanXeSua: {
          include: {
            ChuXe: true,
            HieuXe: true,
          },
        },
        ChiTietPhieuSuaChua: {
          include: {
            PhuTung: true,
            TienCong: true,
          },
        },
      },
    });

    // ------------------------------------------
    // 5. TRẢ VỀ PHIẾU VỪA TẠO
    // ------------------------------------------
    return {
      MaPhieuSuaChua: phieu.MaPhieuSuaChua,
      NgaySuaChua: phieu.NgaySuaChua,
      TongThanhTien: phieu.TongThanhTien,
      BienSo: phieu.TiepNhanXeSua.BienSo,
      ChuXe: phieu.TiepNhanXeSua.ChuXe,
      HieuXe: phieu.TiepNhanXeSua.HieuXe,
      ChiTietPhieuSuaChua: phieu.ChiTietPhieuSuaChua.map(ct => ({
        NoiDung: ct.NoiDung,
        SoLuong: ct.SoLuong,
        ThanhTien: ct.ThanhTien,
        TenPhuTung: ct.PhuTung.TenPhuTung,
        DonGia: ct.PhuTung.DonGia,
        GiaTienCong: ct.TienCong.GiaTienCong,
      })),
    };
  });
}