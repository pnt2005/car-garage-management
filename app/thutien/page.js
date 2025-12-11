"use client";
import { useEffect, useState } from "react";

export default function PhieuThuTien() {
  const [phieus, setPhieus] = useState([]);
  const [chuxes, setChuxes] = useState([]);
  // keep MaTiepNhanXeSua in form for existing records, but we no longer require selecting a repair invoice
  const [form, setForm] = useState({
    MaChuXe: "",
    MaTiepNhanXeSua: "",
    NgayThuTien: "",
    SoTienThu: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rPhieu, rChu] = await Promise.all([
        fetch("/api/thutien"),
        fetch("/api/xe?type=chuxe"),
      ]);
      const [dataPhieu, dataChu] = await Promise.all([rPhieu.json(), rChu.json()]);
      if (rPhieu.ok) setPhieus(dataPhieu || []);
      if (rChu.ok) setChuxes(dataChu || []);
    } catch (e) {
      console.error(e);
      setMsg("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const { MaChuXe, MaTiepNhanXeSua, NgayThuTien, SoTienThu } = form;
      if (!MaChuXe || !NgayThuTien || !SoTienThu) {
        setMsg("Vui lòng nhập đầy đủ thông tin");
        setLoading(false);
        return;
      }

      const r = await fetch("/api/phieuthutien", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          MaPhieuThuTien: editingId,
          MaChuXe,
          MaTiepNhanXeSua: MaTiepNhanXeSua || null,
          NgayThuTien,
          SoTienThu,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Lỗi lưu phiếu");

      await load();
      setMsg(editingId ? "Cập nhật thành công" : "Thêm thành công");
      setForm({
        MaChuXe: "",
        MaTiepNhanXeSua: "",
        NgayThuTien: "",
        SoTienThu: "",
      });
      setEditingId(null);
    } catch (e) {
      console.error(e);
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const edit = (p) => {
    setEditingId(p.MaPhieuThuTien);
    setForm({
      MaChuXe: p.MaChuXe,
      MaTiepNhanXeSua: p.MaTiepNhanXeSua,
      NgayThuTien: p.NgayThuTien.split("T")[0],
      SoTienThu: p.SoTienThu,
    });
  };

  const del = async (MaPhieuThuTien) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;
    setLoading(true);
    const prev = phieus;
    setPhieus(phieus.filter((p) => p.MaPhieuThuTien !== MaPhieuThuTien));
    try {
      const r = await fetch("/api/phieuthutien", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ MaPhieuThuTien }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Lỗi khi xóa");
      setMsg("Xóa thành công");
    } catch (e) {
      console.error(e);
      setPhieus(prev);
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Thu tiền</h1>
      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <select
            value={form.MaChuXe}
            onChange={(e) => onChange("MaChuXe", parseInt(e.target.value))}
            className="p-2 border rounded"
          >
            <option value="">Chọn chủ xe</option>
            {chuxes.map((c) => (
              <option key={c.MaChuXe} value={c.MaChuXe}>
                {c.TenChuXe} (Nợ: {c.TienNo})
              </option>
            ))}
          </select>
          {/* Phiếu sửa xe selector removed as requested */}
          <input
            type="date"
            value={form.NgayThuTien}
            onChange={(e) => onChange("NgayThuTien", e.target.value)}
            className="p-2 border rounded"
          />
          <input
            type="number"
            value={form.SoTienThu}
            onChange={(e) => onChange("SoTienThu", e.target.value)}
            placeholder="Số tiền thu"
            className="p-2 border rounded"
          />
          <div className="col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {editingId ? "Cập nhật" : "Thu tiền"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    MaChuXe: "",
                    MaTiepNhanXeSua: "",
                    NgayThuTien: "",
                    SoTienThu: "",
                  });
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Hủy
              </button>
            )}
          </div>
          {msg && <div className="col-span-2 text-green-600">{msg}</div>}
        </form>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl mb-3">Danh sách phiếu thu tiền</h2>
        {phieus.length === 0 ? (
          <p className="text-gray-500">Chưa có phiếu thu tiền</p>
        ) : (
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Mã</th>
                <th className="border px-2 py-1">Chủ xe</th>
                {/* Phiếu sửa xe column removed */}
                <th className="border px-2 py-1">Ngày thu</th>
                <th className="border px-2 py-1">Số tiền</th>
                <th className="border px-2 py-1">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {phieus.map((p) => (
                <tr key={p.MaPhieuThuTien}>
                  <td className="border px-2 py-1">{p.MaPhieuThuTien}</td>
                  <td className="border px-2 py-1">{p.ChuXe?.TenChuXe}</td>
                  {/* Phiếu sửa xe cell removed */}
                  <td className="border px-2 py-1">
                    {p.NgayThuTien.split("T")[0]}
                  </td>
                  <td className="border px-2 py-1">{p.SoTienThu}</td>
                  <td className="border px-2 py-1 flex gap-2">
                    <button
                      onClick={() => edit(p)}
                      className="px-3 py-1 bg-teal-500 text-white rounded"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => del(p.MaPhieuThuTien)}
                      className="px-3 py-1 bg-red-500 text-white rounded"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
