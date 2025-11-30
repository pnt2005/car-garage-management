"use client";

import { useState, useEffect } from "react";

export default function PhieuSuaChua() {
  const [bienSoTimKiem, setBienSoTimKiem] = useState("");
  const [bienSoLapPhieu, setBienSoLapPhieu] = useState("");
  const [phieuList, setPhieuList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ---- State cho lập phiếu ----
  const [showModal, setShowModal] = useState(false);
  const [ngaySua, setNgaySua] = useState("");
  const [chiTiet, setChiTiet] = useState([
    { MaPhuTung: "", SoLuong: 1, MaTienCong: "", NoiDung: "" },
  ]);

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
    if (bienSoTimKiem) handleXemPhieu(bienSoTimKiem);
    else setPhieuList(null);
  }, [bienSoTimKiem]);

  // ----------------------------
  // HÀM LẬP PHIẾU
  // ----------------------------
  const updateChiTiet = (i, key, value) => {
    const clone = [...chiTiet];
    clone[i][key] = value;
    setChiTiet(clone);
  };

  const addChiTiet = () => {
    setChiTiet([
      ...chiTiet,
      { MaPhuTung: "", SoLuong: 1, MaTienCong: "", NoiDung: "" },
    ]);
  };

  const handleLapPhieu = async () => {
    try {
      const res = await fetch("/api/phieusuachua", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          BienSo: bienSoLapPhieu,
          NgaySuaChua: ngaySua,
          ChiTiet: chiTiet,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert("Lỗi: " + data.error);
        return;
      }

      alert("Lập phiếu thành công!");
      setShowModal(false);
      handleXemPhieu(bienSoTimKiem);
    } catch (err) {
      alert("Lỗi hệ thống: " + err.message);
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Phiếu Sửa Chữa</h1>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Nhập biển số xe..."
          value={bienSoTimKiem}
          onChange={(e) => setBienSoTimKiem(e.target.value)}
          className="p-2 border rounded flex-1"
        />

        <button
          onClick={() => handleXemPhieu(bienSoTimKiem)}
          disabled={!bienSoTimKiem || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Đang tải..." : "Xem phiếu"}
        </button>

        {/* NÚT LẬP PHIẾU */}
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Lập phiếu
        </button>
      </div>

      {message && <p className="mb-4 text-red-600">{message}</p>}

      {phieuList && phieuList.length > 0 && (
        <div className="overflow-x-auto">
          {phieuList.map((phieu, idx) => (
            <div key={idx} className="mb-6 p-4 border rounded bg-gray-50">
              <p className="font-semibold">
                Ngày sửa chữa:{" "}
                {new Date(phieu.NgaySuaChua).toLocaleDateString()}
              </p>
              <p>
                Chủ xe: {phieu.ChuXe.TenChuXe} | Email: {phieu.ChuXe.Email} |
                ĐT: {phieu.ChuXe.DienThoai}
              </p>
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
                      <td className="border px-2 py-1 text-center">
                        {ct.SoLuong}
                      </td>
                      <td className="border px-2 py-1 text-right">
                        {ct.DonGia.toLocaleString()}₫
                      </td>
                      <td className="border px-2 py-1 text-right">
                        {ct.GiaTienCong.toLocaleString()}₫
                      </td>
                      <td className="border px-2 py-1 text-right">
                        {ct.ThanhTien.toLocaleString()}₫
                      </td>
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

      {/* ---------- MODAL LẬP PHIẾU ---------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[480px] relative">
            <h2 className="text-xl font-semibold mb-4">Lập Phiếu Sửa Chữa</h2>

            {/* Biển số */}
            <div className="mb-3">
              <label className="block font-medium">Biển số</label>
              <input
                type="text"
                value={bienSoLapPhieu}
                onChange={(e) => setBienSoLapPhieu(e.target.value)}
                className="border p-2 w-full rounded"
              />
            </div>

            {/* Ngày sửa */}
            <div className="mb-3">
              <label className="block font-medium">Ngày sửa chữa</label>
              <input
                type="date"
                value={ngaySua}
                onChange={(e) => setNgaySua(e.target.value)}
                className="border p-2 w-full rounded"
              />
            </div>

            {/* Chi tiết */}
            {chiTiet.map((ct, i) => (
              <div
                key={i}
                className="max-h-64 overflow-y-auto border p-2 rounded bg-white"
              >
                <input
                  placeholder="Mã phụ tùng"
                  className="border p-2 w-full mb-2 rounded"
                  value={ct.MaPhuTung}
                  onChange={(e) =>
                    updateChiTiet(i, "MaPhuTung", e.target.value)
                  }
                />

                <input
                  placeholder="Số lượng"
                  type="number"
                  className="border p-2 w-full mb-2 rounded"
                  value={ct.SoLuong}
                  onChange={(e) =>
                    updateChiTiet(i, "SoLuong", Number(e.target.value))
                  }
                />

                <input
                  placeholder="Mã tiền công"
                  className="border p-2 w-full mb-2 rounded"
                  value={ct.MaTienCong}
                  onChange={(e) =>
                    updateChiTiet(i, "MaTienCong", e.target.value)
                  }
                />

                <textarea
                  placeholder="Nội dung"
                  className="border p-2 w-full rounded"
                  value={ct.NoiDung}
                  onChange={(e) =>
                    updateChiTiet(i, "NoiDung", e.target.value)
                  }
                />
              </div>
            ))}

            <button
              onClick={addChiTiet}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              + Thêm chi tiết
            </button>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Hủy
              </button>

              <button
                onClick={handleLapPhieu}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Lập phiếu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
