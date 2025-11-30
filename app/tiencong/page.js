"use client";

import { useState, useEffect } from "react";

export default function TienCong() {
  const [tienCongList, setTienCongList] = useState([]);
  const [tenTienCong, setTenTienCong] = useState("");
  const [giaTienCong, setGiaTienCong] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Lấy danh sách tiền công
  const fetchTienCong = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tiencong");
      const data = await res.json();
      if (res.ok) setTienCongList(data.data);
      else setMessage(data.error || "Có lỗi khi lấy dữ liệu");
    } catch (err) {
      console.error(err);
      setMessage("Có lỗi khi gọi API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTienCong();
  }, []);

  // Thêm tiền công mới
  const handleLapTienCong = async () => {
    if (!tenTienCong || !giaTienCong) return;
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/tiencong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TenTienCong: tenTienCong, GiaTienCong: Number(giaTienCong) }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Thêm tiền công thành công!");
        setTenTienCong("");
        setGiaTienCong("");
        fetchTienCong(); // reload danh sách
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quản lý Tiền Công</h1>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Tên tiền công"
          value={tenTienCong}
          onChange={(e) => setTenTienCong(e.target.value)}
          className="p-2 border rounded flex-1"
        />
        <input
          type="number"
          placeholder="Giá tiền công"
          value={giaTienCong}
          onChange={(e) => setGiaTienCong(e.target.value)}
          className="p-2 border rounded w-32"
        />
        <button
          onClick={handleLapTienCong}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Thêm"}
        </button>
      </div>

      {message && <p className="mb-4 text-green-600">{message}</p>}

      <table className="w-full table-auto border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Tên tiền công</th>
            <th className="border px-2 py-1">Giá tiền công</th>
          </tr>
        </thead>
        <tbody>
          {tienCongList.map((tc) => (
            <tr key={tc.MaTienCong}>
              <td className="border px-2 py-1">{tc.TenTienCong}</td>
              <td className="border px-2 py-1 text-right">{tc.GiaTienCong.toLocaleString()}₫</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
