import { NextResponse } from "next/server";
import { xemBaoCaoDoanhSo } from "./xemBaoCaoDoanhSo.js";
import { lapBaoCaoDoanhSo } from "./lapBaoCaoDoanhSo.js";

export async function GET(req, context) {
  const { thang } = await context.params;
  try {
    const baoCao = await xemBaoCaoDoanhSo(Number(thang));
    return NextResponse.json(baoCao);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req, context) {
  const { thang } = await context.params;
  try {
    const baoCao = await lapBaoCaoDoanhSo(Number(thang));
    return NextResponse.json(baoCao);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
