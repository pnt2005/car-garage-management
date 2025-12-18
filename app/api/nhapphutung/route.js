import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/db.js";

// GET - Lập danh sách phiếu nhập phụ tùng
export async function GET() {
  try {
    const phieus = await prisma.nHAPPHUTUNG.findMany({
      orderBy: { MaNhapPhuTung: "desc" },
      include: { ChiTietNhapPhuTung: { include: { PhuTung: true } } },
    });
    return NextResponse.json(phieus);
  } catch (error) {
    console.error("GET /api/nhapphutung error:", error);
    return NextResponse.json(
      { error: "Lỗi khi lập danh sách phiếu nhập phụ tùng" },
      { status: 500 }
    );
  }
}

// POST - Tạo phiếu nhập phụ tùng
export async function POST(req) {
  try {
    const body = await req.json();
    const { NgayNhap, TongTienNhap, ChiTiets } = body;

    if (!NgayNhap || TongTienNhap === undefined || !ChiTiets || ChiTiets.length === 0) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    // Basic validation on details: ensure each detail has either MaPhuTung or TenPhuTung
    for (let i = 0; i < ChiTiets.length; i++) {
      const ct = ChiTiets[i];
      const name = ct.TenPhuTung && ct.TenPhuTung.toString().trim();
      const hasId = ct.MaPhuTung && Number(ct.MaPhuTung) > 0;
      if (!hasId && !name) {
        return NextResponse.json({ error: `Chi tiết thứ ${i + 1} thiếu MaPhuTung hoặc TenPhuTung` }, { status: 400 });
      }
      // validate numbers
      if (!ct.SoLuong || isNaN(parseInt(ct.SoLuong)) || parseInt(ct.SoLuong) <= 0) {
        return NextResponse.json({ error: `Chi tiết thứ ${i + 1} có Số lượng không hợp lệ` }, { status: 400 });
      }
      if (ct.DonGia === undefined || ct.DonGia === null || isNaN(parseFloat(ct.DonGia))) {
        return NextResponse.json({ error: `Chi tiết thứ ${i + 1} có Đơn giá không hợp lệ` }, { status: 400 });
      }
    }

    // Ensure referenced PhuTung exist. If the client sent a TenPhuTung (name)
    // but there is no matching MaPhuTung, create the PHUTUNG row first.
    const result = await prisma.$transaction(async (tx) => {
      // Resolve or create PhuTung ids for each detail
      const detailsWithIds = [];

      for (const ct of ChiTiets) {
        let maPhuTung = ct.MaPhuTung; // may be 0 or null if not found on client

        if (!maPhuTung || maPhuTung === 0) {
          // If client provided TenPhuTung, try to find by name
          if (ct.TenPhuTung) {
            const existing = await tx.pHUTUNG.findFirst({ where: { TenPhuTung: ct.TenPhuTung } });
            if (existing) {
              maPhuTung = existing.MaPhuTung;
            } else {
              // create new phu tung with provided DonGia (or 0)
              const created = await tx.pHUTUNG.create({ data: { TenPhuTung: ct.TenPhuTung, DonGia: parseFloat(ct.DonGia) || 0 } });
              maPhuTung = created.MaPhuTung;
            }
          } else {
            // no MaPhuTung and no TenPhuTung -> validation error
            throw new Error('Chi tiết nhập thiếu MaPhuTung hoặc TenPhuTung');
          }
        }

        detailsWithIds.push({
          MaPhuTung: maPhuTung,
          SoLuong: parseInt(ct.SoLuong),
          DonGia: parseFloat(ct.DonGia),
          TongDonGia: parseFloat(ct.TongDonGia) || (parseInt(ct.SoLuong) * parseFloat(ct.DonGia)),
        });
      }

      // Create the receipt with resolved detail ids
      const phieu = await tx.nHAPPHUTUNG.create({
        data: {
          NgayNhap: new Date(NgayNhap),
          TongTienNhap: parseFloat(TongTienNhap),
          ChiTietNhapPhuTung: {
            create: detailsWithIds.map((d) => ({
              MaPhuTung: d.MaPhuTung,
              SoLuong: d.SoLuong,
              DonGia: d.DonGia,
              TongDonGia: d.TongDonGia,
            })),
          },
        },
        include: { ChiTietNhapPhuTung: { include: { PhuTung: true } } },
      });

      // Increase inventory quantity (SoLuongTon) for each imported part
      for (const detail of detailsWithIds) {
        await tx.pHUTUNG.update({
          where: { MaPhuTung: detail.MaPhuTung },
          data: { SoLuongTon: { increment: detail.SoLuong } },
        });
      }

      return phieu;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/nhapphutung error:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi khi tạo phiếu nhập phụ tùng" },
      { status: 500 }
    );
  }
}

// DELETE - Xóa phiếu nhập (và các chi tiết liên quan)
export async function DELETE(req) {
  try {
    const body = await req.json();
    const { MaNhapPhuTung } = body;

    if (!MaNhapPhuTung) {
      return NextResponse.json({ error: "Thiếu MaNhapPhuTung" }, { status: 400 });
    }

    const id = Number(MaNhapPhuTung);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: "MaNhapPhuTung không hợp lệ" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Get the details before deleting to decrease inventory
      const details = await tx.cHITIETNHAPPHUTUNG.findMany({ where: { MaNhapPhuTung: id } });
      
      // Decrease inventory quantity (SoLuongTon) for each part
      for (const detail of details) {
        await tx.pHUTUNG.update({
          where: { MaPhuTung: detail.MaPhuTung },
          data: { SoLuongTon: { decrement: detail.SoLuong } },
        });
      }

      await tx.cHITIETNHAPPHUTUNG.deleteMany({ where: { MaNhapPhuTung: id } });
      await tx.nHAPPHUTUNG.delete({ where: { MaNhapPhuTung: id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/nhapphutung error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khi xóa phiếu" }, { status: 500 });
  }
}
