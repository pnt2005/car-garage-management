import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db.js";
import { xoaPhuTung } from "./xoaPhuTung.js";

// GET - Lập danh sách phụ tùng
export async function GET() {
  try {
    console.log('GET /api/phutung - Lập danh sách phụ tùng');
    const phuTungs = await prisma.pHUTUNG.findMany({
      orderBy: { MaPhuTung: "asc" },
    });
    console.log('Found', phuTungs.length, 'phụ tùng');
    return NextResponse.json(phuTungs);
  } catch (error) {
    console.error('GET /api/phutung error:', error);
    return NextResponse.json(
      { error: "Lỗi khi lập danh sách phụ tùng: " + error.message },
      { status: 500 }
    );
  }
}

// POST - Thêm phụ tùng mới
export async function POST(req) {
  try {
    const body = await req.json();
    console.log('POST /api/phutung body:', JSON.stringify(body));
    const { TenPhuTung, DonGia } = body;

    if (!TenPhuTung || DonGia === undefined || DonGia === null) {
      console.log('Validation failed:', { TenPhuTung, DonGia });
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    const donGiaValue = parseFloat(DonGia);
    if (isNaN(donGiaValue)) {
      console.log('Invalid DonGia:', DonGia);
      return NextResponse.json(
        { error: "Đơn giá không hợp lệ" },
        { status: 400 }
      );
    }

    console.log('Creating phutung with:', { TenPhuTung, DonGia: donGiaValue });
    const phuTung = await prisma.pHUTUNG.create({
      data: {
        TenPhuTung,
        DonGia: donGiaValue,
      },
    });

    console.log('Created phuTung:', phuTung);
    return NextResponse.json(phuTung, { status: 201 });
  } catch (error) {
    console.error('POST /api/phutung error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || "Lỗi khi thêm phụ tùng" },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật phụ tùng
export async function PUT(req) {
  try {
    const body = await req.json();
    console.log('PUT /api/phutung body:', body);
    const { MaPhuTung, TenPhuTung, DonGia } = body;
    if (!MaPhuTung || !TenPhuTung || DonGia === undefined || DonGia === null) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    const id = parseInt(MaPhuTung);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'MaPhuTung không hợp lệ' }, { status: 400 });
    }

    try {
      const phuTung = await prisma.pHUTUNG.update({
        where: { MaPhuTung: id },
        data: {
          TenPhuTung,
          DonGia: parseFloat(DonGia),
        },
      });
      return NextResponse.json(phuTung);
    } catch (err) {
      if (err && err.code === 'P2025') {
        return NextResponse.json({ error: 'Không tìm thấy phụ tùng để cập nhật' }, { status: 404 });
      }
      throw err;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Lỗi khi cập nhật phụ tùng" },
      { status: 500 }
    );
  }
}

// DELETE - Xóa phụ tùng
export async function DELETE(req) {
  try {
    const body = await req.json();
    const { MaPhuTung } = body;
    if (!MaPhuTung) {
      return NextResponse.json({ error: "Thiếu MaPhuTung" }, { status: 400 });
    }

    const id = parseInt(MaPhuTung);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'MaPhuTung không hợp lệ' }, { status: 400 });
    }

    try {
      const deleted = await xoaPhuTung(id);
      return NextResponse.json(deleted);
    } catch (err) {
      // Prisma foreign key / constraint errors
      if (err && err.code === 'P2003') {
        return NextResponse.json({ error: 'Không thể xóa phụ tùng vì đang được tham chiếu' }, { status: 400 });
      }
      if (err && err.code === 'P2025') {
        return NextResponse.json({ error: 'Không tìm thấy phụ tùng để xóa' }, { status: 404 });
      }
      // if xoaPhuTung threw 'MaPhuTung không hợp lệ' or other errors, return 400 for validation
      if (err && err.message && err.message.includes('không hợp lệ')) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Lỗi khi xóa phụ tùng" }, { status: 500 });
  }
}
