import { NextResponse } from "next/server";
import { tinhDoanhThuTheoHieuXe } from "./tinhDoanhThuTheoHieuXe.js";
import { lapBaoCao } from "./lapBaoCao.js";

export async function GET(req, context) {
  const params = await context.params;
  const thang = parseInt(params.thang);
  try {
    const baoCao = await tinhDoanhThuTheoHieuXe(thang);
    return NextResponse.json({
      ChiTietBaoCaoDoanhSo: baoCao.chiTietBaoCaoDoanhSo || [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Lỗi khi xem báo cáo" }, { status: 500 });
  }
}

export async function POST(req, context) {
  const params = await context.params;
  const thang = parseInt(params.thang);
  try {
    const baoCao = await lapBaoCao(thang);
    return NextResponse.json(baoCao);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Lỗi khi lập báo cáo" }, { status: 500 });
  }
}
