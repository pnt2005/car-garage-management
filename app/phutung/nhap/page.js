"use client";
import { useEffect, useState } from "react";

export default function NhapPhuTung() {
  const [phieus, setPhieus] = useState([]);
  const [phuTungs, setPhuTungs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    NgayNhap: new Date().toISOString().split("T")[0],
    ChiTiets: [{ MaPhuTung: "", SoLuong: "", DonGia: "" }],
  });

  const loadPhieus = async () => {
    try {
      const r = await fetch("/api/nhapphutung");
      const data = await r.json();
      if (r.ok) setPhieus(data || []);
      else setMsg(data.error || "Lỗi khi lấy danh sách phiếu");
    } catch (e) {
      console.error(e);
      setMsg("Lỗi khi lấy danh sách phiếu");
    }
  };

  const loadPhuTungs = async () => {
    try {
      const r = await fetch("/api/phutung");
      const data = await r.json();
      if (r.ok) setPhuTungs(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPhieus();
    loadPhuTungs();
  }, []);

  const deletePhieu = async (id) => {
    if (!confirm("Xác nhận xóa phiếu này?")) return;
    try {
      const r = await fetch("/api/nhapphutung", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ MaNhapPhuTung: id }),
      });
      const data = await r.json();
      if (!r.ok) {
        setMsg(data.error || "Lỗi khi xóa phiếu");
        return;
      }
      setMsg("Xóa phiếu thành công");
      await loadPhieus();
    } catch (e) {
      console.error(e);
      setMsg("Lỗi khi xóa phiếu");
    }
  };

  const addChiTiet = () => {
    setForm((s) => ({
      ...s,
      ChiTiets: [...s.ChiTiets, { TenPhuTung: "", SoLuong: "", DonGia: "" }],
    }));
  };

  const removeChiTiet = (idx) => {
    setForm((s) => ({
      ...s,
      ChiTiets: s.ChiTiets.filter((_, i) => i !== idx),
    }));
  };

  const updateChiTiet = (idx, key, value) => {
    setForm((s) => {
      const updated = [...s.ChiTiets];
      updated[idx] = { ...updated[idx], [key]: value };
      return { ...s, ChiTiets: updated };
    });
  };

  const getTongTienNhap = () => {
    return form.ChiTiets.reduce((sum, ct) => {
      const tong = (parseFloat(ct.SoLuong) || 0) * (parseFloat(ct.DonGia) || 0);
      return sum + (isNaN(tong) ? 0 : tong);
    }, 0);
  };

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      if (!form.NgayNhap) {
        setMsg("Vui lòng chọn ngày nhập");
        setLoading(false);
        return;
      }

      if (form.ChiTiets.length === 0 || form.ChiTiets.some((ct) => !ct.TenPhuTung || !ct.SoLuong || !ct.DonGia)) {
        setMsg("Vui lòng điền đầy đủ chi tiết nhập");
        setLoading(false);
        return;
      }

      const ChiTiets = form.ChiTiets.map((ct) => {
        const phuTung = phuTungs.find((p) => p.TenPhuTung === ct.TenPhuTung);
        return {
          TenPhuTung: ct.TenPhuTung?.toString().trim() || null,
          MaPhuTung: phuTung?.MaPhuTung || 0,
          SoLuong: parseInt(ct.SoLuong) || 0,
          DonGia: parseFloat(ct.DonGia) || 0,
          TongDonGia: (parseInt(ct.SoLuong) || 0) * (parseFloat(ct.DonGia) || 0),
        };
      });

      const body = {
        NgayNhap: form.NgayNhap,
        TongTienNhap: getTongTienNhap(),
        ChiTiets,
      };

      const r = await fetch("/api/nhapphutung", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await r.json();
      if (!r.ok) {
        setMsg(data.error || "Lỗi");
        return;
      }

      setMsg("Tạo phiếu nhập thành công");
      await loadPhieus();
      setForm({
        NgayNhap: new Date().toISOString().split("T")[0],
        ChiTiets: [{ TenPhuTung: "", SoLuong: "", DonGia: "" }],
      });
      setShowForm(false);
    } catch (e) {
      console.error(e);
      setMsg("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v || 0);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nhập phụ tùng</h1>

      {/* list moved below form - placeholder removed */}

      {/* Form tạo phiếu */}
      {showForm && (
        <section className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Tạo phiếu nhập phụ tùng</h2>
          <form onSubmit={submit} className="space-y-4">
            {/* Ngày nhập */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Ngày nhập:</label>
                <input
                  type="date"
                  value={form.NgayNhap}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, NgayNhap: e.target.value }))
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            {/* Chi tiết nhập */}
            <div>
              <h3 className="font-bold mb-2">Chi tiết nhập phụ tùng:</h3>
              <div className="space-y-2">
                {form.ChiTiets.map((ct, idx) => {
                  const tong = (parseFloat(ct.SoLuong) || 0) * (parseFloat(ct.DonGia) || 0);
                  const phuTung = phuTungs.find((p) => p.TenPhuTung === ct.TenPhuTung);
                  return (
                    <div key={idx} className="flex gap-2 items-end">
                      <input
                        type="text"
                        value={ct.TenPhuTung ?? ""}
                        onChange={(e) => updateChiTiet(idx, "TenPhuTung", e.target.value)}
                        placeholder="Tên phụ tùng"
                        className="flex-1 p-2 border rounded"
                        list={`phuTungList-${idx}`}
                      />
                      <datalist id={`phuTungList-${idx}`}>
                        {phuTungs.map((pt) => (
                          <option key={pt.MaPhuTung} value={pt.TenPhuTung} />
                        ))}
                      </datalist>
                      <input
                        type="number"
                        min="1"
                        value={ct.SoLuong}
                        onChange={(e) => updateChiTiet(idx, "SoLuong", e.target.value)}
                        placeholder="SL"
                        className="w-16 p-2 border rounded"
                      />
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={ct.DonGia}
                        onChange={(e) => updateChiTiet(idx, "DonGia", e.target.value)}
                        placeholder="Đơn giá"
                        className="w-28 p-2 border rounded"
                      />
                      <span className="w-24 text-right font-bold">{fmt(tong)}₫</span>
                      <button
                        type="button"
                        onClick={() => removeChiTiet(idx)}
                        className="px-3 py-2 bg-red-500 text-white rounded text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={addChiTiet}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Thêm chi tiết
              </button>
            </div>

            {/* Tổng tiền */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-gray-600">Tổng tiền nhập:</p>
                  <p className="text-2xl font-bold text-green-600">
                    {fmt(getTongTienNhap())}₫
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Lập phiếu
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Hủy
              </button>
            </div>

            {msg && <div className={`p-2 rounded ${msg.includes("thành công") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{msg}</div>}
          </form>
        </section>
      )}
      
            {/* Danh sách phiếu (bỏ lên dưới form) */}
            <section className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Danh sách phiếu nhập</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  {showForm ? "Hủy" : "Tạo phiếu mới"}
                </button>
              </div>

              {phieus.length === 0 ? (
                <p className="text-gray-500">Chưa có phiếu nhập nào</p>
              ) : (
                <div className="space-y-4">
                  {phieus.map((phieu) => (
                    <div key={phieu.MaNhapPhuTung} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between mb-3">
                        <div>
                          <p className="font-bold">Phiếu #{phieu.MaNhapPhuTung}</p>
                          <p className="text-sm text-gray-600">
                            Ngày: {new Date(phieu.NgayNhap).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">
                            {fmt(phieu.TongTienNhap)}₫
                          </p>
                        </div>
                      </div>

                      <table className="w-full text-sm border-collapse border">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border px-2 py-1 text-left">Phụ tùng</th>
                            <th className="border px-2 py-1 text-right">Số lượng</th>
                            <th className="border px-2 py-1 text-right">Đơn giá</th>
                            <th className="border px-2 py-1 text-right">Tổng đơn giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          {phieu.ChiTietNhapPhuTung.map((ct) => (
                            <tr key={ct.MaChiTietNhapPhuTung}>
                              <td className="border px-2 py-1">{ct.PhuTung.TenPhuTung}</td>
                              <td className="border px-2 py-1 text-right">{ct.SoLuong}</td>
                              <td className="border px-2 py-1 text-right">{fmt(ct.DonGia)}₫</td>
                              <td className="border px-2 py-1 text-right font-bold">
                                {fmt(ct.TongDonGia)}₫
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </section>
    </div>
  );
}
