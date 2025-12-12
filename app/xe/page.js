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

  // Load data
  const load = async () => {
    setLoading(true);
    try {
      const [rXe, rChu, rHieu] = await Promise.all([
        fetch("/api/xe"),
        fetch("/api/xe?type=chuxe"),
        fetch("/api/xe?type=hieuxe"),
      ]);

      const [dataXe, dataChu, dataHieu] = await Promise.all([
        rXe.ok ? rXe.json() : [],
        rChu.ok ? rChu.json() : [],
        rHieu.ok ? rHieu.json() : [],
      ]);

      setXes(dataXe || []);
      setChuxes(dataChu || []);
      setHieuxes(dataHieu || []);
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

      // ----- Create Chủ xe -----
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

      // ----- Create Hiệu xe -----
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

      // ----- Required -----
      if (!MaChuXe || !MaHieuXe || !form.BienSo || !form.NgayTiepNhanXeSua) {
        setMsg("Vui lòng nhập đầy đủ thông tin xe");
        setLoading(false);
        return;
      }

      // ----- Create or Update Xe -----
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
      } else {
        setMsg("Xóa thành công");
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
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quản lý Xe</h1>

      {/* FORM */}
      <section className="bg-white p-5 rounded-xl shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Cập nhật xe" : "Thêm xe"}
        </h2>

        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Chủ xe */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Chủ xe</label>
            <select
              value={form.MaChuXe}
              onChange={(e) =>
                onChange(
                  "MaChuXe",
                  e.target.value ? parseInt(e.target.value) : ""
                )
              }
              className="p-2 border rounded"
            >
              <option value="">-- Chọn chủ xe có sẵn --</option>
              {chuxes.map((c) => (
                <option key={c.MaChuXe} value={c.MaChuXe}>
                  {c.TenChuXe}
                </option>
              ))}
            </select>

            {!form.MaChuXe && (
              <>
                <input
                  type="text"
                  value={form.TenChuXe}
                  onChange={(e) => onChange("TenChuXe", e.target.value)}
                  placeholder="Tên chủ xe mới"
                  className="p-2 border rounded"
                />
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
          </div>

          {/* Hiệu xe */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Hiệu xe</label>
            <select
              value={form.MaHieuXe}
              onChange={(e) =>
                onChange(
                  "MaHieuXe",
                  e.target.value ? parseInt(e.target.value) : ""
                )
              }
              className="p-2 border rounded"
            >
              <option value="">-- Chọn hiệu xe có sẵn --</option>
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
          </div>

          {/* Xe info */}
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

          {/* Buttons */}
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              {editingId ? "Cập nhật" : "Thêm mới"}
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

          {msg && (
            <div className="md:col-span-2 text-green-600 font-medium">
              {msg}
            </div>
          )}
        </form>
      </section>

      {/* TABLE */}
      <section className="bg-white p-5 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold mb-3">Danh sách xe</h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2">Mã</th>
                <th className="border p-2">Chủ xe</th>
                <th className="border p-2">Địa chỉ</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Điện thoại</th>
                <th className="border p-2">Tiền nợ</th>
                <th className="border p-2">Hiệu xe</th>
                <th className="border p-2">Biển số</th>
                <th className="border p-2">Ngày tiếp nhận</th>
                <th className="border p-2">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {xes.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center p-4 text-gray-500">
                    Chưa có dữ liệu
                  </td>
                </tr>
              ) : (
                xes.map((x) => (
                  <tr
                    key={x.MaTiepNhanXeSua}
                    className={
                      editingId === x.MaTiepNhanXeSua ? "bg-blue-50" : ""
                    }
                  >
                    <td className="border p-2">{x.MaTiepNhanXeSua}</td>
                    <td className="border p-2">{x.ChuXe?.TenChuXe}</td>
                    <td className="border p-2">{x.ChuXe?.DiaChi}</td>
                    <td className="border p-2">{x.ChuXe?.Email}</td>
                    <td className="border p-2">{x.ChuXe?.DienThoai}</td>
                    <td className="border p-2">{x.ChuXe?.TienNo}</td>
                    <td className="border p-2">{x.HieuXe?.TenHieuXe}</td>
                    <td className="border p-2">{x.BienSo}</td>
                    <td className="border p-2">
                      {x.NgayTiepNhanXeSua.split("T")[0]}
                    </td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => edit(x)}
                        className="px-3 py-1 bg-green-600 text-white rounded mr-2"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => del(x.MaTiepNhanXeSua)}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
