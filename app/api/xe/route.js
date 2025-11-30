import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db.js";

// ===== CHUXE =====
async function getChuXeList() {
  return await prisma.cHUXE.findMany({ orderBy: { MaChuXe: "asc" } });
}
async function createChuXe(body) {
  const { TenChuXe, DiaChi, DienThoai, TienNo = 0, Email } = body;
  if (!TenChuXe || !DiaChi || !DienThoai || !Email)
    throw new Error("Thiếu thông tin CHUXE bắt buộc");
  return await prisma.cHUXE.create({
    data: { TenChuXe, DiaChi, DienThoai, TienNo, Email },
  });
}

// ===== HIEUXE =====
async function getHieuXeList() {
  return await prisma.hIEUXE.findMany({ orderBy: { MaHieuXe: "asc" } });
}
async function createHieuXe(body) {
  const { TenHieuXe } = body;
  if (!TenHieuXe) throw new Error("Tên hiệu xe bắt buộc");
  return await prisma.hIEUXE.create({ data: { TenHieuXe } });
}

// ===== TIEPNHANXESUA =====
async function getXeList() {
  return await prisma.tIEPNHANXESUA.findMany({
    include: { ChuXe: true, HieuXe: true },
    orderBy: { MaTiepNhanXeSua: "asc" },
  });
}
async function createXe(body) {
  const { MaChuXe, MaHieuXe, NgayTiepNhanXeSua, BienSo } = body;
  if (!MaChuXe || !MaHieuXe || !NgayTiepNhanXeSua || !BienSo)
    throw new Error("Thiếu thông tin TIEPNHANXESUA bắt buộc");
  return await prisma.tIEPNHANXESUA.create({
    data: {
      MaChuXe,
      MaHieuXe,
      NgayTiepNhanXeSua: new Date(NgayTiepNhanXeSua),
      BienSo,
    },
  });
}

// ===== MAIN API HANDLER =====
export async function GET(req) {
  try {
    const type = new URL(req.url).searchParams.get("type");

    if (type === "chuxe") return NextResponse.json(await getChuXeList());
    if (type === "hieuxe") return NextResponse.json(await getHieuXeList());
    return NextResponse.json(await getXeList());
  } catch (error) {
    console.error("GET /api/xe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const type = body.type; // body.type = "chuxe" | "hieuxe" | "xe"

    let result;
    if (type === "chuxe") result = await createChuXe(body);
    else if (type === "hieuxe") result = await createHieuXe(body);
    else result = await createXe(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/xe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const type = body.type; // type = "chuxe" | "hieuxe" | "xe"

    let updated;
    if (type === "chuxe") {
      const { MaChuXe, TenChuXe, DiaChi, DienThoai, TienNo, Email } = body;
      updated = await prisma.cHUXE.update({
        where: { MaChuXe: parseInt(MaChuXe) },
        data: { TenChuXe, DiaChi, DienThoai, TienNo, Email },
      });
    } else if (type === "hieuxe") {
      const { MaHieuXe, TenHieuXe } = body;
      updated = await prisma.hIEUXE.update({
        where: { MaHieuXe: parseInt(MaHieuXe) },
        data: { TenHieuXe },
      });
    } else {
      const { MaTiepNhanXeSua, MaChuXe, MaHieuXe, NgayTiepNhanXeSua, BienSo } =
        body;
      updated = await prisma.tIEPNHANXESUA.update({
        where: { MaTiepNhanXeSua: parseInt(MaTiepNhanXeSua) },
        data: {
          MaChuXe,
          MaHieuXe,
          NgayTiepNhanXeSua: new Date(NgayTiepNhanXeSua),
          BienSo,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/xe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const type = body.type; // type = "chuxe" | "hieuxe" | "xe"

    let deleted;
    if (type === "chuxe")
      deleted = await prisma.cHUXE.delete({
        where: { MaChuXe: parseInt(body.MaChuXe) },
      });
    else if (type === "hieuxe")
      deleted = await prisma.hIEUXE.delete({
        where: { MaHieuXe: parseInt(body.MaHieuXe) },
      });
    else
      deleted = await prisma.tIEPNHANXESUA.delete({
        where: { MaTiepNhanXeSua: parseInt(body.MaTiepNhanXeSua) },
      });

    return NextResponse.json(deleted);
  } catch (error) {
    console.error("DELETE /api/xe error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
