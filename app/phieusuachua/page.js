"use client";
import { useState, useEffect } from "react";

export default function PhieuSuaChua() {
  const [phieuList, setPhieuList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [maTiepNhan, setMaTiepNhan] = useState("");
  const [ngaySua, setNgaySua] = useState("");
  const [chiTiet, setChiTiet] = useState([
    { MaPhuTung: "", SoLuong: 1, MaTienCong: "", NoiDung: "" },
  ]);

  const [danhSachXe, setDanhSachXe] = useState([]);
  const [danhSachPhuTung, setDanhSachPhuTung] = useState([]);
  const [danhSachTienCong, setDanhSachTienCong] = useState([]);

  // 1. Hàm tải danh sách phiếu (Sắp xếp mới nhất lên đầu)
  const fetchAllPhieu = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/phieusuachua");
      const data = await res.json();
      if (res.ok) setPhieuList(data.data);
      else setMessage(data.error || "Có lỗi khi lấy dữ liệu");
    } catch (err) {
      console.error(err);
      setMessage("Có lỗi khi gọi API");
    } finally {
      setLoading(false);
    }
  };

  // 2. Load dữ liệu khởi tạo
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchAllPhieu(), loadDropdownData()]);
    };
    loadInitialData();
  }, []);

  const loadDropdownData = async () => {
    try {
      const [xeRes, ptRes, tcRes] = await Promise.all([
        fetch("/api/xe"),
        fetch("/api/phutung"),
        fetch("/api/tiencong"),
      ]);
      
      const xeData = await xeRes.json();
      setDanhSachXe(xeData.map((item) => ({
        MaTiepNhanXeSua: item.MaTiepNhanXeSua,
        label: `${item.BienSo} - ${item.HieuXe?.TenHieuXe || ""} - ${item.ChuXe?.TenChuXe || ""}`,
      })));

      const ptData = await ptRes.json();
      setDanhSachPhuTung(ptData.map((item) => ({
        MaPhuTung: item.MaPhuTung,
        label: `${item.TenPhuTung} (Còn: ${item.SoLuongTon || 0}, Giá: ${item.DonGia.toLocaleString()}đ)`,
      })));

      const tcResponse = await tcRes.json();
      const tcData = tcResponse.data || [];
      setDanhSachTienCong(tcData.map((item) => ({
        MaTienCong: item.MaTienCong,
        label: `${item.TenTienCong} (${item.GiaTienCong.toLocaleString()}đ)`,
      })));
    } catch (err) {
      console.error("Lỗi load dropdown:", err);
    }
  };

  // 3. Logic xử lý Chi Tiết (Thêm)
  const addChiTiet = () => {
    setChiTiet([...chiTiet, { MaPhuTung: "", SoLuong: "", MaTienCong: "", NoiDung: "" }]);
  };

  // 4. HÀM LẬP PHIẾU (Gộp logic POST và Refresh)
  const handleLapPhieu = async () => {
    if (!maTiepNhan) return alert("Vui lòng chọn xe!");
    if (!ngaySua) return alert("Vui lòng chọn ngày sửa chữa!");

    for (let i = 0; i < chiTiet.length; i++) {
      const ct = chiTiet[i];
      if (!ct.MaPhuTung || !ct.MaTienCong || !ct.NoiDung.trim()) {
        return alert(`Chi tiết ${i + 1} chưa đầy đủ thông tin!`);
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
      
      if (res.ok) {
        setMessage("Lập phiếu thành công!");
        setShowModal(false);
        setMaTiepNhan("");
        setNgaySua("");
        setChiTiet([{ MaPhuTung: "", SoLuong: "", MaTienCong: "", NoiDung: "" }]);
        fetchAllPhieu(); // reload danh sách
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
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Phiếu Sửa Chữa</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded font-bold shadow-md hover:bg-blue-700 transition-all uppercase text-sm"
        >
          + Lập Phiếu Mới
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700 text-sm">
          {message}
        </div>
      )}

      <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-300">
        <table className="w-full table-auto border-collapse bg-white text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="border-r border-gray-300 px-4 py-3 text-left font-bold text-gray-700 w-32">Ngày sửa</th>
              <th className="border-r border-gray-300 px-4 py-3 text-left font-bold text-gray-700 w-56">Thông tin Xe</th>
              <th className="border-r border-gray-300 px-4 py-3 text-left font-bold text-gray-700">Nội dung công việc</th>
              <th className="px-4 py-3 text-right font-bold text-gray-700 w-44">Tổng tiền</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr key="loading"><td colSpan="4" className="py-10 text-center text-gray-500 italic">Đang tải dữ liệu từ máy chủ...</td></tr>
            ) : phieuList.length === 0 ? (
              <tr key="empty"><td colSpan="4" className="py-10 text-center text-gray-400 font-medium">Chưa có dữ liệu phiếu sửa chữa nào.</td></tr>
            ) : (
              phieuList.map((p, idx) => (
                <tr key={p.MaPhieuSuaChua || idx} className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors">
                  <td className="border-r border-gray-300 px-4 py-3 align-top text-gray-600 font-medium">
                    {p.NgaySuaChua ? new Date(p.NgaySuaChua).toLocaleDateString("vi-VN") : "-"}
                  </td>
                  <td className="border-r border-gray-300 px-4 py-3 align-top">
                    <div className="font-bold text-gray-900">{p.TiepNhanXeSua?.BienSo || p.BienSo || "N/A"}</div>
                    <div className="text-[11px] text-gray-500 uppercase mt-1">
                      Chủ xe: {p.ChuXe?.TenChuXe || "Trống"} 
                    </div>
                    <div className="text-[11px] text-gray-400 italic">
                      Hiệu xe: {p.HieuXe?.TenHieuXe || "Trống"}
                    </div>
                  </td>
                  <td className="border-r border-gray-300 px-4 py-3">
                    <div className="space-y-2">
                      {(p.ChiTietPhieuSuaChua || []).map((ct, i) => (
                        <div key={`item-${idx}-${i}`} className="text-sm pb-1 border-b border-gray-50 last:border-0">
                          <p className="font-semibold text-gray-700">• {ct.NoiDung}</p>
                          <p className="text-[11px] text-gray-500 ml-3">
                            <span>{ct.TenPhuTung} (SL: {ct.SoLuong}) | Đơn giá: {ct.DonGia?.toLocaleString()}₫ | </span>
                            <span>Tiền Công: {ct.GiaTienCong?.toLocaleString()}₫ | </span>
                            <span className="font-bold text-blue-600">Thành tiền: {ct.ThanhTien?.toLocaleString()}₫</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-green-700 text-base">
                    {p.TongThanhTien?.toLocaleString()}₫
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL LẬP PHIẾU - KHÔNG UPDATE/REMOVE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">LẬP PHIẾU SỬA CHỮA</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">✕</button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mã tiếp nhận xe *</label>
                  <select
                    value={maTiepNhan}
                    onChange={(e) => setMaTiepNhan(e.target.value)}
                    className="w-full border-gray-300 border p-2.5 rounded shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- Chọn hồ sơ xe --</option>
                    {danhSachXe.map((xe) => (
                      <option key={xe.MaTiepNhanXeSua} value={xe.MaTiepNhanXeSua}>{xe.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày lập phiếu *</label>
                  <input
                    type="date"
                    value={ngaySua}
                    onChange={(e) => setNgaySua(e.target.value)}
                    className="w-full border-gray-300 border p-2.5 rounded shadow-sm outline-none"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-gray-700 uppercase text-sm tracking-wider">Danh mục sửa chữa</h3>
                  <button 
                    onClick={addChiTiet}
                    className="bg-green-600 text-white px-4 py-1.5 rounded-full text-xs font-bold hover:bg-green-700 shadow-sm"
                  >
                    + THÊM NỘI DUNG
                  </button>
                </div>

                <div className="space-y-4">
                  {chiTiet.map((ct, i) => (
                    <div key={`input-${i}`} className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 shadow-inner">
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Vật tư phụ tùng</label>
                          <select 
                            className="w-full border border-gray-300 p-2 rounded text-sm bg-white"
                            onChange={(e) => (chiTiet[i].MaPhuTung = e.target.value)}
                          >
                            <option value="">-- Chọn phụ tùng --</option>
                            {danhSachPhuTung.map((pt) => (
                              <option key={pt.MaPhuTung} value={pt.MaPhuTung}>{pt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Số lượng</label>
                          <input 
                            type="number" min="1" defaultValue="1"
                            className="w-full border border-gray-300 p-2 rounded text-sm bg-white text-center"
                            onChange={(e) => (chiTiet[i].SoLuong = Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Loại tiền công</label>
                          <select 
                            className="w-full border border-gray-300 p-2 rounded text-sm bg-white"
                            onChange={(e) => (chiTiet[i].MaTienCong = e.target.value)}
                          >
                            <option value="">-- Chọn hình thức --</option>
                            {danhSachTienCong.map((tc) => (
                              <option key={tc.MaTienCong} value={tc.MaTienCong}>{tc.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Nội dung sửa chữa</label>
                          <input 
                            type="text"
                            placeholder="Mô tả công việc sửa chữa..."
                            className="w-full border border-gray-300 p-2 rounded text-sm bg-white"
                            onChange={(e) => (chiTiet[i].NoiDung = e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-6 py-2 border border-gray-300 rounded text-gray-600 font-bold hover:bg-gray-100 transition-colors uppercase text-xs"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleLapPhieu}
                disabled={loading}
                className="px-10 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50 shadow-lg uppercase text-xs tracking-widest"
              >
                {loading ? "Đang xử lý..." : "Lưu & Hoàn Tất"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );}
