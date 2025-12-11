"use client";
import { useEffect, useState } from "react";

export default function PhieuThuTien() {
  const [phieus, setPhieus] = useState([]);
  const [chuxes, setChuxes] = useState([]);
  const [tiepnhanxes, setTiepNhanXes] = useState([]);
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
      const [rPhieu, rChu, rXe] = await Promise.all([
        fetch("/api/thutien"),
        fetch("/api/xe?type=chuxe"),
        fetch("/api/xe"),
      ]);
      const [dataPhieu, dataChu, dataXe] = await Promise.all([
        rPhieu.json(),
        rChu.json(),
        rXe.json(),
      ]);
      if (rPhieu.ok) setPhieus(dataPhieu || []);
      if (rChu.ok) setChuxes(dataChu || []);
      if (rXe.ok) setTiepNhanXes(dataXe || []);
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
      if (!MaChuXe || !MaTiepNhanXeSua || !NgayThuTien || !SoTienThu) {
        setMsg("Vui lòng nhập đầy đủ thông tin");
        setLoading(false);
        return;
      }

      const r = await fetch("/api/thutien", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          MaPhieuThuTien: editingId,
          MaChuXe,
          MaTiepNhanXeSua,
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
      const r = await fetch("/api/thutien", {
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

  // ===== HÀM IN PHIẾU =====
  const printPhieu = (p) => {
    const w = window.open("", "_blank", "width=800,height=600");

    w.document.write(`
      <html>
        <head>
          <title>Phiếu thu tiền #${p.MaPhieuThuTien}</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h2 { margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td, th { border: 1px solid #000; padding: 8px; }
          </style>
        </head>
        <body>
          <h2>PHIẾU THU TIỀN</h2>
          <p><strong>Mã phiếu:</strong> ${p.MaPhieuThuTien}</p>
          <p><strong>Chủ xe:</strong> ${p.ChuXe?.TenChuXe || ""}</p>
          <p><strong>Biển số:</strong> ${p.TiepNhanXeSua?.BienSo || ""}</p>
          <p><strong>Ngày thu:</strong> ${p.NgayThuTien.split("T")[0]}</p>

          <table>
            <tr>
              <th>Số tiền thu</th>
            </tr>
            <tr>
              <td>${p.SoTienThu}</td>
            </tr>
          </table>

          <script>
            window.print();
            window.onafterprint = () => window.close();
          </script>
        </body>
      </html>
    `);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Thu tiền</h1>

      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          {/* form fields */}
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

          <select
            value={form.MaTiepNhanXeSua}
            onChange={(e) =>
              onChange("MaTiepNhanXeSua", parseInt(e.target.value))
            }
            className="p-2 border rounded"
          >
            <option value="">Chọn phiếu sửa xe</option>
            {tiepnhanxes
              .filter((x) => x.MaChuXe === form.MaChuXe)
              .map((x) => (
                <option key={x.MaTiepNhanXeSua} value={x.MaTiepNhanXeSua}>
                  {x.BienSo} ({x.NgayTiepNhanXeSua.split("T")[0]})
                </option>
              ))}
          </select>

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
                <th className="border px-2 py-1">Phiếu sửa xe</th>
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
                  <td className="border px-2 py-1">
                    {p.TiepNhanXeSua?.BienSo}
                  </td>
                  <td className="border px-2 py-1">
                    {p.NgayThuTien.split("T")[0]}
                  </td>
                  <td className="border px-2 py-1">{p.SoTienThu}</td>

                  <td className="border px-2 py-1">
                    <div className="flex justify-center items-center space-x-2">
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

                      <button
                        onClick={() => printPhieu(p)}
                        className="px-3 py-1 bg-gray-700 text-white rounded"
                      >
                        In
                      </button>
                    </div>
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
