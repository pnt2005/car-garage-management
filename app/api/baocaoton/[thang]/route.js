import { NextResponse } from "next/server";
import { xemBaoCaoTon } from "./xemBaoCaoTon.js";
import { lapBaoCaoTon } from "./lapBaoCaoTon.js";

export async function GET(req, context) {
  const { thang } = await context.params;
  try {
    const baoCao = await xemBaoCaoTon(Number(thang));
    return NextResponse.json(baoCao);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function POST(req, context) {
  const { thang } = await context.params;
  try {
    const baoCao = await lapBaoCaoTon(Number(thang));
    return NextResponse.json(baoCao);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
