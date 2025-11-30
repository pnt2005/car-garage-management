import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db.js";

// ===== PHIEUTHUTIEN =====
async function getPhieuThuList() {
  return await prisma.pHIEUTHUTIEN.findMany({
    include: { ChuXe: true, TiepNhanXeSua: true },
    orderBy: { MaPhieuThuTien: "asc" },
  });
}

async function createPhieuThu(body) {
  const { MaChuXe, MaTiepNhanXeSua, NgayThuTien, SoTienThu } = body;
  if (!MaChuXe || !MaTiepNhanXeSua || !NgayThuTien || !SoTienThu)
    throw new Error("Thiếu thông tin PHIEUTHUTIEN bắt buộc");
  // Update TienNo của Chủ xe
  const chuXe = await prisma.cHUXE.findUnique({ where: { MaChuXe } });
  if (!chuXe) throw new Error("Chủ xe không tồn tại");

  await prisma.cHUXE.update({
    where: { MaChuXe },
    data: { TienNo: chuXe.TienNo - parseFloat(SoTienThu) },
  });

  return await prisma.pHIEUTHUTIEN.create({
    data: {
      MaChuXe,
      MaTiepNhanXeSua,
      NgayThuTien: new Date(NgayThuTien),
      SoTienThu: parseFloat(SoTienThu),
    },
  });
}

async function updatePhieuThu(body) {
  const { MaPhieuThuTien, MaChuXe, MaTiepNhanXeSua, NgayThuTien, SoTienThu } =
    body;
  if (
    !MaPhieuThuTien ||
    !MaChuXe ||
    !MaTiepNhanXeSua ||
    !NgayThuTien ||
    !SoTienThu
  )
    throw new Error("Thiếu thông tin PHIEUTHUTIEN để cập nhật");

  return await prisma.pHIEUTHUTIEN.update({
    where: { MaPhieuThuTien: parseInt(MaPhieuThuTien) },
    data: {
      MaChuXe,
      MaTiepNhanXeSua,
      NgayThuTien: new Date(NgayThuTien),
      SoTienThu: parseFloat(SoTienThu),
    },
  });
}

async function deletePhieuThu(MaPhieuThuTien) {
  return await prisma.pHIEUTHUTIEN.delete({
    where: { MaPhieuThuTien: parseInt(MaPhieuThuTien) },
  });
}

// ===== MAIN API HANDLER =====
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
