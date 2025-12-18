import { NextResponse } from "next/server";
import { lapTienCong } from "./lapTienCong.js";
import { xemTienCong } from "./xemTienCong.js";
/** * GET /api/tien-cong * Lấy danh sách tất cả tiền công */ export async function GET() {
  try {
    const list = await xemTienCong();
    return NextResponse.json({
      message: "Lấy tiền công thành công",
      data: list,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
/** * POST /api/tien-cong * Thêm tiền công mới * Body: { TenTienCong, GiaTienCong } */ export async function POST(
  req
) {
  try {
    const data = await req.json();
    const tienCong = await lapTienCong(data);
    return NextResponse.json({
      message: "Tạo tiền công thành công",
      data: tienCong,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
