"use client";
import { useEffect, useState } from "react";

export default function Xe() {
  const [xes, setXes] = useState([]);
  const [chuxes, setChuxes] = useState([]);
  const [hieuxes, setHieuxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    MaChuXe: "",
    MaHieuXe: "",
    BienSo: "",
    NgayTiepNhanXeSua: "",
    TenChuXe: "",
    DiaChi: "",
    DienThoai: "",
    Email: "",
    TenHieuXe: "",
  });
  const [editingId, setEditingId] = useState(null);

  // Load dữ liệu
  const load = async () => {
    setLoading(true);
    try {
      const [rXe, rChu, rHieu] = await Promise.all([
        fetch("/api/xe"),
        fetch("/api/xe?type=chuxe"),
        fetch("/api/xe?type=hieuxe"),
      ]);
      const [dataXe, dataChu, dataHieu] = await Promise.all([
        rXe.json(),
        rChu.json(),
        rHieu.json(),
      ]);
      if (rXe.ok) setXes(dataXe || []);
      else setMsg(dataXe.error || "Lỗi khi lấy danh sách xe");
      if (rChu.ok) setChuxes(dataChu || []);
      if (rHieu.ok) setHieuxes(dataHieu || []);
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
    e?.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      let MaChuXe = form.MaChuXe;
      let MaHieuXe = form.MaHieuXe;

      // Tạo Chủ xe mới nếu cần
      if (!MaChuXe && form.TenChuXe) {
        const r = await fetch("/api/xe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "chuxe",
            TenChuXe: form.TenChuXe,
            DiaChi: form.DiaChi,
            DienThoai: form.DienThoai,
            Email: form.Email,
          }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Lỗi tạo chủ xe");
        MaChuXe = data.MaChuXe;
      }

      // Tạo Hiệu xe mới nếu cần
      if (!MaHieuXe && form.TenHieuXe) {
        const r = await fetch("/api/xe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "hieuxe", TenHieuXe: form.TenHieuXe }),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Lỗi tạo hiệu xe");
        MaHieuXe = data.MaHieuXe;
      }

      // Kiểm tra bắt buộc cho xe
      if (!MaChuXe || !MaHieuXe || !form.BienSo || !form.NgayTiepNhanXeSua) {
        setMsg("Vui lòng nhập đầy đủ thông tin xe");
        setLoading(false);
        return;
      }

      // Tạo hoặc cập nhật xe
      const rXe = await fetch("/api/xe", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "xe",
          MaTiepNhanXeSua: editingId,
          MaChuXe,
          MaHieuXe,
          BienSo: form.BienSo,
          NgayTiepNhanXeSua: form.NgayTiepNhanXeSua,
        }),
      });
      const dataXe = await rXe.json();
      if (!rXe.ok) throw new Error(dataXe.error || "Lỗi tạo xe");

      await load();
      setMsg(editingId ? "Cập nhật thành công" : "Thêm thành công");
      setForm({
        MaChuXe: "",
        MaHieuXe: "",
        BienSo: "",
        NgayTiepNhanXeSua: "",
        TenChuXe: "",
        DiaChi: "",
        DienThoai: "",
        Email: "",
        TenHieuXe: "",
      });
      setEditingId(null);
    } catch (e) {
      console.error(e);
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const edit = (x) => {
    setEditingId(x.MaTiepNhanXeSua);
    setForm({
      MaChuXe: x.MaChuXe,
      MaHieuXe: x.MaHieuXe,
      BienSo: x.BienSo,
      NgayTiepNhanXeSua: x.NgayTiepNhanXeSua.split("T")[0],
      TenChuXe: "",
      DiaChi: "",
      DienThoai: "",
      Email: "",
      TenHieuXe: "",
    });
  };

  const del = async (MaTiepNhanXeSua) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;
    setLoading(true);
    setMsg("");
    const prev = xes;
    setXes((p) => p.filter((x) => x.MaTiepNhanXeSua !== MaTiepNhanXeSua));
    try {
      const r = await fetch("/api/xe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "xe", MaTiepNhanXeSua }),
      });
      const data = await r.json();
      if (!r.ok) {
        setMsg(data.error || "Lỗi khi xóa");
        setXes(prev);
      } else setMsg("Xóa thành công");
      if (editingId === MaTiepNhanXeSua) {
        setEditingId(null);
        setForm({
          MaChuXe: "",
          MaHieuXe: "",
          BienSo: "",
          NgayTiepNhanXeSua: "",
          TenChuXe: "",
          DiaChi: "",
          DienThoai: "",
          Email: "",
          TenHieuXe: "",
        });
      }
    } catch (e) {
      console.error(e);
      setMsg("Lỗi khi xóa");
      setXes(prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quản lý Xe</h1>

      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl mb-3">{editingId ? "Cập nhật" : "Thêm"} xe</h2>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          {/* Chọn hoặc nhập Chủ xe */}
          <select
            value={form.MaChuXe}
            onChange={(e) => onChange("MaChuXe", parseInt(e.target.value))}
            className="p-2 border rounded"
          >
            <option value="">Chọn chủ xe có sẵn</option>
            {chuxes.map((c) => (
              <option key={c.MaChuXe} value={c.MaChuXe}>
                {c.TenChuXe}
              </option>
            ))}
          </select>
          {!form.MaChuXe && (
            <input
              type="text"
              value={form.TenChuXe}
              onChange={(e) => onChange("TenChuXe", e.target.value)}
              placeholder="Tên chủ xe mới"
              className="p-2 border rounded"
            />
          )}
          {!form.MaChuXe && (
            <>
              <input
                type="text"
                value={form.DiaChi}
                onChange={(e) => onChange("DiaChi", e.target.value)}
                placeholder="Địa chỉ"
                className="p-2 border rounded"
              />
              <input
                type="text"
                value={form.DienThoai}
                onChange={(e) => onChange("DienThoai", e.target.value)}
                placeholder="Điện thoại"
                className="p-2 border rounded"
              />
              <input
                type="email"
                value={form.Email}
                onChange={(e) => onChange("Email", e.target.value)}
                placeholder="Email"
                className="p-2 border rounded"
              />
            </>
          )}

          {/* Chọn hoặc nhập Hiệu xe */}
          <select
            value={form.MaHieuXe}
            onChange={(e) => onChange("MaHieuXe", parseInt(e.target.value))}
            className="p-2 border rounded"
          >
            <option value="">Chọn hiệu xe có sẵn</option>
            {hieuxes.map((h) => (
              <option key={h.MaHieuXe} value={h.MaHieuXe}>
                {h.TenHieuXe}
              </option>
            ))}
          </select>
          {!form.MaHieuXe && (
            <input
              type="text"
              value={form.TenHieuXe}
              onChange={(e) => onChange("TenHieuXe", e.target.value)}
              placeholder="Tên hiệu xe mới"
              className="p-2 border rounded"
            />
          )}

          {/* Biển số & ngày */}
          <input
            type="text"
            value={form.BienSo}
            onChange={(e) => onChange("BienSo", e.target.value)}
            placeholder="Biển số"
            className="p-2 border rounded"
          />
          <input
            type="date"
            value={form.NgayTiepNhanXeSua}
            onChange={(e) => onChange("NgayTiepNhanXeSua", e.target.value)}
            className="p-2 border rounded"
          />

          {/* Nút submit */}
          <div className="col-span-2 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              {editingId ? "Cập nhật" : "Thêm"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    MaChuXe: "",
                    MaHieuXe: "",
                    BienSo: "",
                    NgayTiepNhanXeSua: "",
                    TenChuXe: "",
                    DiaChi: "",
                    DienThoai: "",
                    Email: "",
                    TenHieuXe: "",
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

      {/* Danh sách xe */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl mb-3">Danh sách xe</h2>
        {xes.length === 0 ? (
          <p className="text-gray-500">Chưa có xe</p>
        ) : (
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Mã</th>
                <th className="border px-2 py-1">Chủ xe</th>
                <th className="border px-2 py-1">Hiệu xe</th>
                <th className="border px-2 py-1">Biển số</th>
                <th className="border px-2 py-1">Ngày tiếp nhận</th>
                <th className="border px-2 py-1">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {xes.map((x) => (
                <tr
                  key={x.MaTiepNhanXeSua}
                  className={
                    editingId === x.MaTiepNhanXeSua ? "bg-blue-50" : ""
                  }
                >
                  <td className="border px-2 py-1">{x.MaTiepNhanXeSua}</td>
                  <td className="border px-2 py-1">{x.ChuXe?.TenChuXe}</td>
                  <td className="border px-2 py-1">{x.HieuXe?.TenHieuXe}</td>
                  <td className="border px-2 py-1">{x.BienSo}</td>
                  <td className="border px-2 py-1">
                    {x.NgayTiepNhanXeSua.split("T")[0]}
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <button
                      onClick={() => edit(x)}
                      className="px-3 py-1 bg-teal-500 text-white rounded mr-2"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => del(x.MaTiepNhanXeSua)}
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
