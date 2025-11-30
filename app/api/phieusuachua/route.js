import { NextResponse } from "next/server";
import { xemPhieuSuaChua } from "./xemPhieuSuaChua.js";
import { lapPhieuSuaChua } from "./lapPhieuSuaChua.js";

/**
 * GET /api/phieu-sua-chua/:bienSo
 * Trả về danh sách phiếu sửa chữa của xe
 */
export async function GET(req, context) {
  const { bienSo } = context.params;

  try {
    const data = await xemPhieuSuaChua(bienSo);
    return NextResponse.json({ message: "Lấy phiếu sửa chữa thành công", data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

/**
 * POST /api/phieu-sua-chua
 * Body: { BienSo, NgaySuaChua, ChiTiet: [{ MaPhuTung, SoLuong, MaTienCong, NoiDung }] }
 * Tạo phiếu sửa chữa mới
 */
export async function POST(req) {
  try {
    const data = await req.json();
    const phieu = await lapPhieuSuaChua(data);
    return NextResponse.json({ message: "Tạo phiếu sửa chữa thành công", phieu });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
