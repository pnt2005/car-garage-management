import { prisma } from '@/app/lib/db.js';

export async function lapDanhSachPhuTung() {
  const phuTungs = await prisma.pHUTUNG.findMany({
    orderBy: { MaPhuTung: "asc" },
  });

  return phuTungs;
}
