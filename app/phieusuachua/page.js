"use client";

import { useState, useEffect } from "react";

export default function PhieuSuaChua() {
  const [bienSo, setBienSo] = useState("");
  const [phieuList, setPhieuList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ----------------------------
  // Hàm xem phiếu sửa chữa
  // ----------------------------
  const handleXemPhieu = async (bs) => {
    if (!bs) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/phieusuachua/${bs}`);
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Có lỗi khi lấy dữ liệu");
        setPhieuList(null);
        return;
      }
      setPhieuList(data);
    } catch (err) {
      console.error(err);
      setMessage("Có lỗi xảy ra khi gọi API");
    } finally {
      setLoading(false);
    }
  };

  // Tự động fetch khi thay đổi biển số
  useEffect(() => {
    if (bienSo) handleXemPhieu(bienSo);
    else setPhieuList(null);
  }, [bienSo]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Phiếu Sửa Chữa</h1>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Nhập biển số xe..."
          value={bienSo}
          onChange={(e) => setBienSo(e.target.value)}
          className="p-2 border rounded flex-1"
        />
        <button
          onClick={() => handleXemPhieu(bienSo)}
          disabled={!bienSo || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Đang tải..." : "Xem phiếu"}
        </button>
      </div>

      {message && <p className="mb-4 text-red-600">{message}</p>}

      {phieuList && phieuList.length > 0 && (
        <div className="overflow-x-auto">
          {phieuList.map((phieu, idx) => (
            <div key={idx} className="mb-6 p-4 border rounded bg-gray-50">
              <p className="font-semibold">
                Ngày sửa chữa: {new Date(phieu.NgaySuaChua).toLocaleDateString()}
              </p>
              <p>Chủ xe: {phieu.ChuXe.TenChuXe} | Email: {phieu.ChuXe.Email} | ĐT: {phieu.ChuXe.DienThoai}</p>
              <p>Hiệu xe: {phieu.HieuXe.TenHieuXe}</p>
              <p className="font-semibold mt-2">
                Tổng tiền: {phieu.TongThanhTien.toLocaleString()}₫
              </p>

              <table className="w-full table-auto border border-gray-300 mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Nội dung</th>
                    <th className="border px-2 py-1">Phụ tùng</th>
                    <th className="border px-2 py-1">Số lượng</th>
                    <th className="border px-2 py-1">Đơn giá</th>
                    <th className="border px-2 py-1">Tiền công</th>
                    <th className="border px-2 py-1">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {phieu.ChiTietPhieuSuaChua.map((ct, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">{ct.NoiDung}</td>
                      <td className="border px-2 py-1">{ct.TenPhuTung}</td>
                      <td className="border px-2 py-1 text-center">{ct.SoLuong}</td>
                      <td className="border px-2 py-1 text-right">{ct.DonGia.toLocaleString()}₫</td>
                      <td className="border px-2 py-1 text-right">{ct.GiaTienCong.toLocaleString()}₫</td>
                      <td className="border px-2 py-1 text-right">{ct.ThanhTien.toLocaleString()}₫</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {phieuList && phieuList.length === 0 && (
        <p className="text-gray-600">Xe này chưa có phiếu sửa chữa nào.</p>
      )}
    </div>
  );
}
