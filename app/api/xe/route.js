import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db.js";

let MAX_XE = 30; // Cho phép thay đổi bằng PUT /api/xe?config=max_xe

// ===== CHUXE =====
async function getChuXeList() {
  return await prisma.cHUXE.findMany({ orderBy: { MaChuXe: "asc" } });
}

async function createChuXe(body) {
  const { TenChuXe, DiaChi, DienThoai, TienNo = 0, Email } = body;

  if (!TenChuXe || !DiaChi || !DienThoai || !Email)
    throw new Error("Thiếu thông tin CHUXE bắt buộc");

  if (!/^\d{10,11}$/.test(DienThoai))
    throw new Error("Số điện thoại không hợp lệ");
  if (!/^\S+@\S+\.\S+$/.test(Email)) throw new Error("Email không hợp lệ");

  // Kiểm tra xem số điện thoại đã tồn tại chưa
  const existing = await prisma.cHUXE.findFirst({
    where: {
      OR: [{ DienThoai: DienThoai }, { Email: Email }],
    },
  });

  if (existing) {
    throw new Error("Số điện thoại hoặc email đã tồn tại trong hệ thống");
  }

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

async function getTodayCount(date) {
  const start = new Date(date.setHours(0, 0, 0, 0));
  const end = new Date(date.setHours(23, 59, 59, 999));

  return await prisma.tIEPNHANXESUA.count({
    where: {
      NgayTiepNhanXeSua: { gte: start, lte: end },
    },
  });
}

async function createXe(body) {
  const { MaChuXe, MaHieuXe, NgayTiepNhanXeSua, BienSo } = body;

  if (!MaChuXe || !MaHieuXe || !NgayTiepNhanXeSua || !BienSo)
    throw new Error("Thiếu thông tin TIEPNHANXESUA bắt buộc");

  const date = new Date(NgayTiepNhanXeSua);
  const count = await getTodayCount(date);

  if (count >= MAX_XE)
    throw new Error(`Số xe tối đa trong ngày đã đạt ${MAX_XE}`);

  return await prisma.tIEPNHANXESUA.create({
    data: {
      MaChuXe,
      MaHieuXe,
      NgayTiepNhanXeSua: new Date(NgayTiepNhanXeSua),
      BienSo,
    },
  });
}

// ===== API METHODS =====
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const keyword = url.searchParams.get("keyword");

    if (type === "count") {
      const today = new Date();
      const count = await getTodayCount(today);
      return NextResponse.json({ count, max: MAX_XE });
    }

    if (type === "chuxe") return NextResponse.json(await getChuXeList());
    if (type === "hieuxe") return NextResponse.json(await getHieuXeList());

    // 🔍 TRA CỨU
    if (keyword) {
      const data = await searchXe(keyword);
      return NextResponse.json(data);
    }

    // 📋 DANH SÁCH FULL
    return NextResponse.json(await getXeList());
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const type = body.type;

    let result;

    if (type === "chuxe") result = await createChuXe(body);
    else if (type === "hieuxe") result = await createHieuXe(body);
    else result = await createXe(body);

    return NextResponse.json(
      { message: "Thêm thành công", data: result },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const url = new URL(req.url);
    const configUpdate = url.searchParams.get("config");

    // Cập nhật cấu hình MAX_XE
    if (configUpdate === "max_xe") {
      const { value } = await req.json();
      MAX_XE = parseInt(value);
      return NextResponse.json({
        message: "Cập nhật MAX_XE thành công",
        MAX_XE,
      });
    }

    const body = await req.json();
    const type = body.type;

    let updated;

    if (type === "chuxe") {
      const { MaChuXe, TenChuXe, DiaChi, DienThoai, TienNo, Email } = body;

      if (!/^\d{10,11}$/.test(DienThoai))
        throw new Error("Số điện thoại không hợp lệ");
      if (!/^\S+@\S+\.\S+$/.test(Email)) throw new Error("Email không hợp lệ");

      updated = await prisma.cHUXE.update({
        where: { MaChuXe: parseInt(MaChuXe) },
        data: { TenChuXe, DiaChi, DienThoai, TienNo, Email },
      });
    } else if (type === "hieuxe") {
      updated = await prisma.hIEUXE.update({
        where: { MaHieuXe: parseInt(body.MaHieuXe) },
        data: { TenHieuXe: body.TenHieuXe },
      });
    } else {
      updated = await prisma.tIEPNHANXESUA.update({
        where: { MaTiepNhanXeSua: parseInt(body.MaTiepNhanXeSua) },
        data: {
          MaChuXe: body.MaChuXe,
          MaHieuXe: body.MaHieuXe,
          NgayTiepNhanXeSua: new Date(body.NgayTiepNhanXeSua),
          BienSo: body.BienSo,
        },
      });
    }

    return NextResponse.json({ message: "Sửa thành công", data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const type = body.type;
    let deleted;

    if (type === "chuxe") {
      deleted = await prisma.cHUXE.delete({
        where: { MaChuXe: parseInt(body.MaChuXe) },
      });
    } else if (type === "hieuxe") {
      deleted = await prisma.hIEUXE.delete({
        where: { MaHieuXe: parseInt(body.MaHieuXe) },
      });
    } else {
      const id = parseInt(body.MaTiepNhanXeSua);

      await prisma.pHIEUSUACHUA.deleteMany({ where: { MaTiepNhanXeSua: id } });
      await prisma.pHIEUTHUTIEN.deleteMany({ where: { MaTiepNhanXeSua: id } });

      deleted = await prisma.tIEPNHANXESUA.delete({
        where: { MaTiepNhanXeSua: id },
      });
    }

    return NextResponse.json({ message: "Xóa thành công", data: deleted });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function searchXe(keyword) {
  return await prisma.tIEPNHANXESUA.findMany({
    where: {
      OR: [
        {
          BienSo: {
            contains: keyword,
          },
        },
        {
          ChuXe: {
            TenChuXe: {
              contains: keyword,
            },
          },
        },
        {
          ChuXe: {
            DienThoai: {
              contains: keyword,
            },
          },
        },
        {
          HieuXe: {
            TenHieuXe: {
              contains: keyword,
            },
          },
        },
      ],
    },
    include: {
      ChuXe: true,
      HieuXe: true,
    },
    orderBy: { MaTiepNhanXeSua: "asc" },
  });
}
