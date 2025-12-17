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
  const { MaChuXe, NgayThuTien, SoTienThu } = body;
  const soTienThuFloat = parseFloat(SoTienThu);
  const maChuXeInt = parseInt(MaChuXe);

  if (isNaN(soTienThuFloat) || soTienThuFloat <= 0)
    throw new Error("Số tiền thu không hợp lệ");

  // 1. Lấy thông tin chủ xe và Tham số hệ thống
  const [chuXe, thamSo] = await Promise.all([
    prisma.cHUXE.findUnique({ where: { MaChuXe: maChuXeInt } }),
    prisma.tHAM_SO.findFirst({ where: { id: 1 } }), // Giả định id=1 là mặc định
  ]);

  if (!chuXe) throw new Error("Chủ xe không tồn tại");

  const tienNo = Number(chuXe.TienNo); // luôn ≤ 0

  if (tienNo < 0 && soTienThuFloat < thamSo.SoTienNoToiThieu) {
    throw new Error(
      `Số tiền thu vượt quá số nợ hiện tại (${Math.abs(tienNo)} VND)`
    );
  }

  // 3. Chạy Transaction: Tạo phiếu và Cập nhật nợ
  const result = await prisma.$transaction(async (tx) => {
    const phieu = await tx.pHIEUTHUTIEN.create({
      data: {
        MaChuXe: maChuXeInt,
        NgayThuTien: new Date(NgayThuTien),
        SoTienThu: soTienThuFloat,
        MaTiepNhanXeSua: body.MaTiepNhanXeSua
          ? parseInt(body.MaTiepNhanXeSua)
          : null,
      },
      include: { ChuXe: true },
    });

    await tx.cHUXE.update({
      where: { MaChuXe: maChuXeInt },
      data: { TienNo: { decrement: soTienThuFloat } },
    });

    return phieu;
  });

  return result;
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
