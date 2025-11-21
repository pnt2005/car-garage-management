"use client";
import { useState, useEffect } from "react";

export default function BaoCaoDoanhSo() {
  const [thang, setThang] = useState("");
  const [baoCao, setBaoCao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLapBaoCao = async () => {
    if (!thang) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/baocaodoanhso/${thang}`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setMessage("Lập/cập nhật báo cáo thành công!");
        setBaoCao(data);
      } else {
        setMessage(data.error || "Có lỗi xảy ra");
      }
    } catch (err) {
      console.error(err);
      setMessage("Có lỗi xảy ra khi gọi API");
    } finally {
      setLoading(false);
    }
  };

  const handleXemBaoCao = async (thang) => {
    if (!thang) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/baocaodoanhso/${thang}`);
      const data = await res.json();
      if (!res.ok) {
      setMessage(data.error);
      setBaoCao(null);
      return;
    }
      setBaoCao(data);
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Khi chọn tháng, tự động fetch báo cáo hiện có
  useEffect(() => {
    if (thang) handleXemBaoCao(thang);
    else setBaoCao(null);
  }, [thang]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Báo cáo doanh số</h1>

      <div className="flex gap-4 mb-4">
        <select
          className="p-2 border rounded"
          value={thang}
          onChange={(e) => setThang(e.target.value)}
        >
          <option value="">Chọn tháng</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              Tháng {i + 1}
            </option>
          ))}
        </select>

        <button
          onClick={handleLapBaoCao}
          disabled={!thang || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Lập/Cập nhật báo cáo"}
        </button>
      </div>

      {message && <p className="mb-4 text-green-600">{message}</p>}
        
      {baoCao && (
        <>
          <div className="mb-4 p-3 border rounded bg-gray-50">
            <p className="font-semibold">
              Tổng doanh thu tháng {thang}:{" "}
              <span className="text-blue-600">
                {baoCao.TongDoanhThu?.toLocaleString()}₫
              </span>
            </p>
          </div>
          <table className="w-full table-auto border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Hiệu xe</th>
                <th className="border px-2 py-1">Số lượt sửa</th>
                <th className="border px-2 py-1">Doanh thu</th>
                <th className="border px-2 py-1">Tỷ lệ (%)</th>
              </tr>
            </thead>
            <tbody>
              {baoCao.ChiTietBaoCaoDoanhSo?.map((ct) => (
                <tr key={ct.MaChiTietBaoCaoDoanhSo}>
                  <td className="border px-2 py-1">{ct.TenHieuXe}</td>
                  <td className="border px-2 py-1 text-center">{ct.SoLuotSua}</td>
                  <td className="border px-2 py-1 text-right">{ct.ThanhTien.toLocaleString()}₫</td>
                  <td className="border px-2 py-1 text-center">{ct.TiLe.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
