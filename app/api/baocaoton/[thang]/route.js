import { NextResponse } from "next/server";
import { tinhBaoCaoTon } from "./tinhBaoCaoTon.js";
import { lapBaoCaoTon } from "./lapBaoCaoTon.js";

export async function GET(req, context) {
  const params = await context.params;
  const thang = parseInt(params.thang);
  try {
    const baoCao = await tinhBaoCaoTon(thang);
    return NextResponse.json({
      ChiTietBaoCaoTon: baoCao.chiTietBaoCaoTon || [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi khi xem báo cáo tồn: ", detail: error.message }, { status: 500 });
  }   
}

export async function POST(req, context) {
  const params = await context.params;
  const thang = parseInt(params.thang);
  try {
    const baoCao = await lapBaoCaoTon(thang);
    return NextResponse.json(baoCao);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi khi lập báo cáo tồn: ", error }, { status: 500 });
  }
}
