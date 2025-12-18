"use client"
import { useState, useEffect } from "react";

export default function PhieuSuaChua() {
  const [bienSoTimKiem, setBienSoTimKiem] = useState("");
  const [phieuList, setPhieuList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ---- State cho lập phiếu ----
  const [showModal, setShowModal] = useState(false);
  const [maTiepNhan, setMaTiepNhan] = useState("");
  const [ngaySua, setNgaySua] = useState("");
  const [chiTiet, setChiTiet] = useState([
    { MaPhuTung: "", SoLuong: 1, MaTienCong: "", NoiDung: "" },
  ]);

  // ---- Data cho dropdowns ----
  const [danhSachXe, setDanhSachXe] = useState([]);
  const [danhSachPhuTung, setDanhSachPhuTung] = useState([]);
  const [danhSachTienCong, setDanhSachTienCong] = useState([]);

  // ----------------------------
  // Load dữ liệu cho dropdowns
  // ----------------------------
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        // 1. Lấy danh sách xe (TIEPNHANXESUA) - GET /api/xe
        const xeRes = await fetch("/api/xe");
        if (!xeRes.ok) {
          console.error("Lỗi API xe:", await xeRes.text());
        } else {
          const xeData = await xeRes.json(); // Trả về array trực tiếp
          const formatted = xeData.map((item) => ({
            MaTiepNhanXeSua: item.MaTiepNhanXeSua,
            BienSo: item.BienSo,
            TenChuXe: item.ChuXe?.TenChuXe || "",
            TenHieuXe: item.HieuXe?.TenHieuXe || "",
            label: `${item.BienSo} - ${item.HieuXe?.TenHieuXe || ""} - ${item.ChuXe?.TenChuXe || ""}`,
          }));
          setDanhSachXe(formatted);
        }

        // 2. Lấy danh sách phụ tùng - GET /api/phutung
        const phuTungRes = await fetch("/api/phutung");
        if (!phuTungRes.ok) {
          console.error("Lỗi API phụ tùng:", await phuTungRes.text());
        } else {
          const phuTungData = await phuTungRes.json(); // Trả về array trực tiếp
          const formatted = phuTungData.map((item) => ({
            MaPhuTung: item.MaPhuTung,
            TenPhuTung: item.TenPhuTung,
            DonGia: item.DonGia,
            SoLuongTon: item.SoLuongTon || 0,
            label: `${item.TenPhuTung} (Còn: ${item.SoLuongTon || 0}, Giá: ${item.DonGia.toLocaleString()}đ)`,
          }));
          setDanhSachPhuTung(formatted);
        }

        // 3. Lấy danh sách tiền công - GET /api/tiencong
        const tienCongRes = await fetch("/api/tiencong");
        if (!tienCongRes.ok) {
          console.error("Lỗi API tiền công:", await tienCongRes.text());
        } else {
          const tienCongResponse = await tienCongRes.json();
          const tienCongData = tienCongResponse.data || []; // Có wrap trong .data
          const formatted = tienCongData.map((item) => ({
            MaTienCong: item.MaTienCong,
            TenTienCong: item.TenTienCong,
            GiaTienCong: item.GiaTienCong,
            label: `${item.TenTienCong} (${item.GiaTienCong.toLocaleString()}đ)`,
          }));
          setDanhSachTienCong(formatted);
        }
      } catch (err) {
        console.error("Lỗi khi load dữ liệu dropdown:", err);
      }
    };

    loadDropdownData();
  }, []);

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
      setPhieuList(data.data);
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

  const removeChiTiet = (i) => {
    if (chiTiet.length === 1) return;
    setChiTiet(chiTiet.filter((_, idx) => idx !== i));
  };

  const handleLapPhieu = async () => {
    if (!maTiepNhan) {
      alert("Vui lòng chọn xe!");
      return;
    }
    if (!ngaySua) {
      alert("Vui lòng chọn ngày sửa chữa!");
      return;
    }

    // Validate chi tiết
    for (let i = 0; i < chiTiet.length; i++) {
      const ct = chiTiet[i];
      if (!ct.MaPhuTung || !ct.MaTienCong || !ct.NoiDung.trim()) {
        alert(`Chi tiết ${i + 1} chưa đầy đủ thông tin!`);
        return;
      }
    }

    try {
      const res = await fetch("/api/phieusuachua", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          MaTiepNhanXeSua: Number(maTiepNhan),
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
      
      // Reset form
      setMaTiepNhan("");
      setNgaySua("");
      setChiTiet([{ MaPhuTung: "", SoLuong: 1, MaTienCong: "", NoiDung: "" }]);
      
      // Refresh danh sách nếu đang xem xe này
      if (bienSoTimKiem) {
        handleXemPhieu(bienSoTimKiem);
      }
    } catch (err) {
      alert("Lỗi hệ thống: " + err.message);
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Phiếu Sửa Chữa</h1>

      <div className="flex gap-4 mb-6">
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

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          + Lập phiếu mới
        </button>
      </div>

      {message && <p className="mb-4 p-3 bg-red-50 text-red-600 rounded border border-red-200">{message}</p>}

      {phieuList && phieuList.length > 0 && (
        <div className="space-y-6">
          {phieuList.map((phieu, idx) => (
            <div key={idx} className="p-5 border rounded-lg bg-white shadow-sm">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Ngày sửa chữa</p>
                  <p className="font-semibold">
                    {new Date(phieu.NgaySuaChua).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng tiền</p>
                  <p className="font-semibold text-green-600 text-lg">
                    {phieu.TongThanhTien.toLocaleString()}₫
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded mb-4">
                <p><span className="font-medium">Chủ xe:</span> {phieu.ChuXe.TenChuXe}</p>
                <p><span className="font-medium">Email:</span> {phieu.ChuXe.Email}</p>
                <p><span className="font-medium">ĐT:</span> {phieu.ChuXe.DienThoai}</p>
                <p><span className="font-medium">Hiệu xe:</span> {phieu.HieuXe.TenHieuXe}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-3 py-2 text-left">Nội dung</th>
                      <th className="border px-3 py-2 text-left">Phụ tùng</th>
                      <th className="border px-3 py-2 text-center">Số lượng</th>
                      <th className="border px-3 py-2 text-right">Đơn giá</th>
                      <th className="border px-3 py-2 text-right">Tiền công</th>
                      <th className="border px-3 py-2 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phieu.ChiTietPhieuSuaChua.map((ct, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="border px-3 py-2">{ct.NoiDung}</td>
                        <td className="border px-3 py-2">{ct.TenPhuTung}</td>
                        <td className="border px-3 py-2 text-center">{ct.SoLuong}</td>
                        <td className="border px-3 py-2 text-right">
                          {ct.DonGia.toLocaleString()}₫
                        </td>
                        <td className="border px-3 py-2 text-right">
                          {ct.GiaTienCong.toLocaleString()}₫
                        </td>
                        <td className="border px-3 py-2 text-right font-medium">
                          {ct.ThanhTien.toLocaleString()}₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {phieuList && phieuList.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Xe này chưa có phiếu sửa chữa nào.</p>
        </div>
      )}

      {/* ---------- MODAL LẬP PHIẾU ---------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4">
              <h2 className="text-xl font-bold">Lập Phiếu Sửa Chữa Mới</h2>
            </div>

            <div className="p-4 space-y-4">
              {/* Chọn xe */}
              <div>
                <label className="block font-medium mb-1">
                  Chọn xe <span className="text-red-500">*</span>
                </label>
                <select
                  value={maTiepNhan}
                  onChange={(e) => setMaTiepNhan(e.target.value)}
                  className="border p-2 w-full rounded"
                >
                  <option value="">-- Chọn xe --</option>
                  {danhSachXe.map((xe) => (
                    <option key={xe.MaTiepNhanXeSua} value={xe.MaTiepNhanXeSua}>
                      {xe.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngày sửa */}
              <div>
                <label className="block font-medium mb-1">
                  Ngày sửa chữa <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={ngaySua}
                  onChange={(e) => setNgaySua(e.target.value)}
                  className="border p-2 w-full rounded"
                />
              </div>

              {/* Chi tiết sửa chữa */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-medium">
                    Chi tiết sửa chữa <span className="text-red-500">*</span>
                  </label>
                  <button
                    onClick={addChiTiet}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    + Thêm dòng
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {chiTiet.map((ct, i) => (
                    <div key={i} className="border rounded p-3 bg-gray-50 relative">
                      {chiTiet.length > 1 && (
                        <button
                          onClick={() => removeChiTiet(i)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold"
                        >
                          ✕
                        </button>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        {/* Phụ tùng */}
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Phụ tùng
                          </label>
                          <select
                            value={ct.MaPhuTung}
                            onChange={(e) =>
                              updateChiTiet(i, "MaPhuTung", e.target.value)
                            }
                            className="border p-2 w-full rounded text-sm"
                          >
                            <option value="">-- Chọn phụ tùng --</option>
                            {danhSachPhuTung.map((pt) => (
                              <option key={pt.MaPhuTung} value={pt.MaPhuTung}>
                                {pt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Số lượng */}
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Số lượng
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={ct.SoLuong}
                            onChange={(e) =>
                              updateChiTiet(i, "SoLuong", Number(e.target.value))
                            }
                            className="border p-2 w-full rounded text-sm"
                          />
                        </div>
                      </div>

                      {/* Tiền công */}
                      <div className="mt-2">
                        <label className="block text-sm font-medium mb-1">
                          Loại tiền công
                        </label>
                        <select
                          value={ct.MaTienCong}
                          onChange={(e) =>
                            updateChiTiet(i, "MaTienCong", e.target.value)
                          }
                          className="border p-2 w-full rounded text-sm"
                        >
                          <option value="">-- Chọn loại tiền công --</option>
                          {danhSachTienCong.map((tc) => (
                            <option key={tc.MaTienCong} value={tc.MaTienCong}>
                              {tc.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Nội dung */}
                      <div className="mt-2">
                        <label className="block text-sm font-medium mb-1">
                          Nội dung công việc
                        </label>
                        <textarea
                          placeholder="Mô tả chi tiết công việc..."
                          value={ct.NoiDung}
                          onChange={(e) =>
                            updateChiTiet(i, "NoiDung", e.target.value)
                          }
                          className="border p-2 w-full rounded text-sm"
                          rows="2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Hủy
              </button>

              <button
                onClick={handleLapPhieu}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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