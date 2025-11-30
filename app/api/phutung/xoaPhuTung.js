import { prisma } from '@/app/lib/db.js';

export async function xoaPhuTung(MaPhuTung) {
  if (!MaPhuTung) {
    throw new Error('Thiếu mã phụ tùng');
  }

  const id = parseInt(MaPhuTung);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error('MaPhuTung không hợp lệ');
  }

  // Delete dependent rows first to avoid FK constraint errors.
  // Use a transaction to ensure atomicity.
  const result = await prisma.$transaction(async (tx) => {
    await tx.cHITIETPHIEUSUACHUA.deleteMany({ where: { MaPhuTung: id } });
    await tx.cHITIETNHAPPHUTUNG.deleteMany({ where: { MaPhuTung: id } });
    await tx.cHITIETBAOCAOTON.deleteMany({ where: { MaPhuTung: id } });

    const deleted = await tx.pHUTUNG.delete({ where: { MaPhuTung: id } });
    return deleted;
  });

  return result;
}
