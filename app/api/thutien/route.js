import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db.js";

// ===== PHIEUTHUTIEN (ĐÃ CHỈNH SỬA) =====
async function getPhieuThuList() {
  return await prisma.pHIEUTHUTIEN.findMany({
    include: { ChuXe: true, TiepNhanXeSua: true },
    orderBy: { MaPhieuThuTien: "asc" },
  });
}

async function createPhieuThu(body) {
  // 1. Bỏ MaTiepNhanXeSua khỏi kiểm tra bắt buộc
  const { MaChuXe, NgayThuTien, SoTienThu } = body;

  if (!MaChuXe || !NgayThuTien || !SoTienThu)
    throw new Error(
      "Thiếu thông tin PHIEUTHUTIEN bắt buộc: Chủ xe, Ngày thu, Số tiền thu"
    ); // 2. Xử lý dữ liệu

  const soTienThuFloat = parseFloat(SoTienThu);
  const maChuXeInt = parseInt(MaChuXe);
  const maTiepNhanXeSuaInt = body.MaTiepNhanXeSua
    ? parseInt(body.MaTiepNhanXeSua)
    : null; // Lấy hoặc gán null

  if (isNaN(soTienThuFloat) || soTienThuFloat <= 0)
    throw new Error("Số tiền thu không hợp lệ"); // 3. Update TienNo của Chủ xe

  const chuXe = await prisma.cHUXE.findUnique({
    where: { MaChuXe: maChuXeInt },
  });
  if (!chuXe) throw new Error("Chủ xe không tồn tại");

  await prisma.cHUXE.update({
    where: { MaChuXe: maChuXeInt },
    data: { TienNo: chuXe.TienNo - soTienThuFloat },
  }); // 4. Tạo Phiếu Thu Tiền (DẠNG ĐÃ SỬA LỖI CÚ PHÁP)

  return await prisma.pHIEUTHUTIEN.create({
    data: {
      MaChuXe: maChuXeInt, // DÒNG GÂY LỖI: HÃY XÓA TOÀN BỘ PHẦN CHÚ THÍCH NẾU NÓ GÂY RA LỖI
      MaTiepNhanXeSua: maTiepNhanXeSuaInt, // KHÔNG CÓ BẤT KỲ KÝ TỰ THỪA NÀO TRƯỚC DẤU PHẨY HOẶC TRƯỚC DÒNG TIẾP THEO

      NgayThuTien: new Date(NgayThuTien),
      SoTienThu: soTienThuFloat,
    }, // <-- Đóng ngoặc nhọn của data
    include: { ChuXe: true, TiepNhanXeSua: true },
  });
}

async function updatePhieuThu(body) {
  // Bỏ MaTiepNhanXeSua khỏi kiểm tra bắt buộc
  const { MaPhieuThuTien, MaChuXe, NgayThuTien, SoTienThu } = body;
  if (!MaPhieuThuTien || !MaChuXe || !NgayThuTien || !SoTienThu)
    throw new Error("Thiếu thông tin PHIEUTHUTIEN để cập nhật");

  const maTiepNhanXeSuaInt = body.MaTiepNhanXeSua
    ? parseInt(body.MaTiepNhanXeSua)
    : null;

  return await prisma.pHIEUTHUTIEN.update({
    where: { MaPhieuThuTien: parseInt(MaPhieuThuTien) },
    data: {
      MaChuXe: parseInt(MaChuXe),
      MaTiepNhanXeSua: maTiepNhanXeSuaInt, // Đã chỉnh sửa để truyền null an toàn
      NgayThuTien: new Date(NgayThuTien),
      SoTienThu: parseFloat(SoTienThu),
    },
  });
}

async function deletePhieuThu(MaPhieuThuTien) {
  // *LƯU Ý*: Nếu bạn muốn hoàn lại TienNo khi xóa, bạn phải truyền MaChuXe và SoTienThu
  // từ client và thêm logic hoàn tiền vào đây.
  return await prisma.pHIEUTHUTIEN.delete({
    where: { MaPhieuThuTien: parseInt(MaPhieuThuTien) },
  });
}

// ===== MAIN API HANDLER (GIỮ NGUYÊN) =====
export async function GET(req) {
  try {
    return NextResponse.json(await getPhieuThuList());
  } catch (error) {
    console.error("GET /api/phieuthutien error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const result = await createPhieuThu(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/phieuthutien error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const updated = await updatePhieuThu(body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/phieuthutien error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const deleted = await deletePhieuThu(body.MaPhieuThuTien);
    return NextResponse.json(deleted);
  } catch (error) {
    console.error("DELETE /api/phieuthutien error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
