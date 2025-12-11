"use client";
import { useEffect, useState } from "react";

export default function Xe() {
  const [xes, setXes] = useState([]);
  const [chuxes, setChuxes] = useState([]);
  const [hieuxes, setHieuxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [countInfo, setCountInfo] = useState({ count: 0, max: 30 });

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

  // LOAD DATA
  const load = async () => {
    setLoading(true);
    try {
      const [rXe, rChu, rHieu, rCount] = await Promise.all([
        fetch("/api/xe"),
        fetch("/api/xe?type=chuxe"),
        fetch("/api/xe?type=hieuxe"),
        fetch("/api/xe?type=count"),
      ]);

      // Reset state trước khi set data mới
      setXes([]);
      setChuxes([]);
      setHieuxes([]);

      const xeData = await rXe.json();
      const chuData = await rChu.json();
      const hieuData = await rHieu.json();

      // Filter duplicates trước khi set state
      const uniqueChuxes = filterDuplicates(chuData || [], "MaChuXe");
      const uniqueHieuxes = filterDuplicates(hieuData || [], "MaHieuXe");

      setXes(xeData || []);
      setChuxes(uniqueChuxes);
      setHieuxes(uniqueHieuxes);

      if (rCount.ok) setCountInfo(await rCount.json());
    } catch (e) {
      console.error(e);
      setMsg("Lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  // Hàm filter duplicates
  const filterDuplicates = (array, key) => {
    const seen = new Set();
    return array.filter((item) => {
      const duplicate = seen.has(item[key]);
      seen.add(item[key]);
      return !duplicate;
    });
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // VALIDATE EMAIL / PHONE CLIENT-SIDE
  const validate = () => {
    if (form.Email && !/^\S+@\S+\.\S+$/.test(form.Email))
      return "Email không hợp lệ";

    if (form.DienThoai && !/^\d{10,11}$/.test(form.DienThoai))
      return "Số điện thoại phải có 10-11 số";

    return null;
  };

  // SUBMIT FORM
  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setMsg("");

    const err = validate();
    if (err) {
      setLoading(false);
      setMsg(err);
      return;
    }

    try {
      let MaChuXe = form.MaChuXe;
      let MaHieuXe = form.MaHieuXe;

      // Nếu đang chỉnh sửa và có thông tin chủ xe mới => cập nhật chủ xe hiện tại
      if (
        editingId &&
        MaChuXe &&
        (form.TenChuXe || form.DiaChi || form.DienThoai || form.Email)
      ) {
        try {
          const r = await fetch("/api/xe", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "chuxe",
              MaChuXe: MaChuXe,
              TenChuXe: form.TenChuXe,
              DiaChi: form.DiaChi,
              DienThoai: form.DienThoai,
              Email: form.Email,
              TienNo: form.TienNo || 0,
            }),
          });

          const data = await r.json();
          if (!r.ok) {
            console.warn("Không thể cập nhật chủ xe:", data.error);
            // Vẫn tiếp tục với việc cập nhật xe nếu lỗi
          } else {
            console.log("Đã cập nhật thông tin chủ xe");
          }
        } catch (chuxeError) {
          console.error("Lỗi khi cập nhật chủ xe:", chuxeError);
        }
      }

      // Tạo chủ xe mới nếu chọn "thêm mới" và không có MaChuXe
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
            TienNo: form.TienNo || 0,
          }),
        });

        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Lỗi tạo chủ xe");
        MaChuXe = data.data?.MaChuXe;

        // RELOAD danh sách chủ xe ngay lập tức
        const rChu = await fetch("/api/xe?type=chuxe");
        const newChuxes = await rChu.json();
        setChuxes(newChuxes || []);
      }

      // Xử lý hiệu xe tương tự
      if (!MaHieuXe && form.TenHieuXe) {
        const r = await fetch("/api/xe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "hieuxe", TenHieuXe: form.TenHieuXe }),
        });

        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Lỗi tạo hiệu xe");
        MaHieuXe = data.data?.MaHieuXe;

        // RELOAD danh sách hiệu xe ngay lập tức
        const rHieu = await fetch("/api/xe?type=hieuxe");
        const newHieuxes = await rHieu.json();
        setHieuxes(newHieuxes || []);
      }

      // Cập nhật thông tin hiệu xe nếu đang chỉnh sửa
      if (editingId && MaHieuXe && form.TenHieuXe) {
        try {
          const r = await fetch("/api/xe", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "hieuxe",
              MaHieuXe: MaHieuXe,
              TenHieuXe: form.TenHieuXe,
            }),
          });
          const data = await r.json();
          if (!r.ok) console.warn("Không thể cập nhật hiệu xe:", data.error);
        } catch (hieuxeError) {
          console.error("Lỗi khi cập nhật hiệu xe:", hieuxeError);
        }
      }

      if (!MaChuXe || !MaHieuXe || !form.BienSo || !form.NgayTiepNhanXeSua) {
        setMsg("Vui lòng nhập đầy đủ thông tin xe");
        setLoading(false);
        return;
      }

      // Cập nhật hoặc tạo xe
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
      if (!rXe.ok) throw new Error(dataXe.error || "Lỗi lưu xe");

      await load();

      setMsg(editingId ? "Sửa thành công" : "Thêm thành công");

      setForm({
        MaChuXe: "",
        MaHieuXe: "",
        BienSo: "",
        NgayTiepNhanXeSua: "",
        TenChuXe: "",
        DiaChi: "",
        DienThoai: "",
        Email: "",
        TienNo: 0,
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

  // EDIT
  const edit = (x) => {
    setEditingId(x.MaTiepNhanXeSua);
    setForm({
      MaChuXe: x.MaChuXe,
      MaHieuXe: x.MaHieuXe,
      BienSo: x.BienSo,
      NgayTiepNhanXeSua: x.NgayTiepNhanXeSua.split("T")[0],
      TenChuXe: x.ChuXe?.TenChuXe || "",
      DiaChi: x.ChuXe?.DiaChi || "",
      DienThoai: x.ChuXe?.DienThoai || "",
      Email: x.ChuXe?.Email || "",
      TienNo: x.ChuXe?.TienNo || 0,
      TenHieuXe: x.HieuXe?.TenHieuXe || "",
    });
    setMsg("Đang chỉnh sửa. Có thể cập nhật thông tin chủ xe hiện tại.");
  };

  // DELETE
  const del = async (MaTiepNhanXeSua) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;

    setLoading(true);

    try {
      const r = await fetch("/api/xe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "xe", MaTiepNhanXeSua }),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Lỗi khi xóa");

      setMsg("Xóa thành công");
      await load();
    } catch (e) {
      console.error(e);
      setMsg(e.message || "Lỗi khi xóa");
    } finally {
      setLoading(false);
    }
  };

  const printXe = (x) => {
    const printContent = `
    <h2>Thông tin tiếp nhận xe</h2>
    <p><b>Mã:</b> ${x.MaTiepNhanXeSua}</p>
    <p><b>Chủ xe:</b> ${x.ChuXe?.TenChuXe}</p>
    <p><b>Địa chỉ:</b> ${x.ChuXe?.DiaChi}</p>
    <p><b>Email:</b> ${x.ChuXe?.Email}</p>
    <p><b>Điện thoại:</b> ${x.ChuXe?.DienThoai}</p>
    <p><b>Hiệu xe:</b> ${x.HieuXe?.TenHieuXe}</p>
    <p><b>Biển số:</b> ${x.BienSo}</p>
    <p><b>Ngày tiếp nhận:</b> ${x.NgayTiepNhanXeSua.split("T")[0]}</p>
  `;

    const newWindow = window.open("", "_blank", "width=600,height=800");
    newWindow.document.write(printContent);
    newWindow.print();
    newWindow.close();
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quản lý Xe</h1>

      {/* COUNT */}
      <div className="mb-4 text-lg font-semibold text-blue-600">
        Xe đã tiếp nhận trong hôm nay: {countInfo.count} / {countInfo.max}
      </div>

      {/* FORM */}
      <section className="bg-white p-5 rounded-xl shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Cập nhật xe" : "Thêm xe"}
        </h2>

        <form
          onSubmit={submit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* CHỦ XE */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Chủ xe</label>
            <select
              value={form.MaChuXe}
              onChange={(e) => {
                const newMaChuXe = e.target.value
                  ? parseInt(e.target.value)
                  : "";
                onChange("MaChuXe", newMaChuXe);

                // Nếu chọn chủ xe có sẵn, tự động điền thông tin
                if (newMaChuXe) {
                  const selectedChuXe = chuxes.find(
                    (c) => c.MaChuXe === newMaChuXe
                  );
                  if (selectedChuXe) {
                    setForm((prev) => ({
                      ...prev,
                      TenChuXe: selectedChuXe.TenChuXe,
                      DiaChi: selectedChuXe.DiaChi,
                      DienThoai: selectedChuXe.DienThoai,
                      Email: selectedChuXe.Email,
                      TienNo: selectedChuXe.TienNo || 0,
                    }));
                  }
                }
              }}
              className="p-2 border rounded"
            >
              <option value="">-- Chọn chủ xe có sẵn --</option>
              {chuxes.map((c) => (
                <option key={c.MaChuXe} value={c.MaChuXe}>
                  {c.TenChuXe} {c.DienThoai ? `(${c.DienThoai})` : ""}
                </option>
              ))}
            </select>

            {/* THÔNG TIN CHỦ XE - luôn hiển thị khi có MaChuXe hoặc đang chỉnh sửa */}
            {(form.MaChuXe || !form.MaChuXe) && (
              <>
                {editingId && form.MaChuXe && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    Đang chỉnh sửa thông tin chủ xe hiện tại
                  </div>
                )}

                {!form.MaChuXe && (
                  <div className="text-m text-blue-600 bg-blue-50 p-2 rounded">
                    Tạo chủ xe mới
                  </div>
                )}

                <input
                  className="p-2 border rounded"
                  placeholder="Tên chủ xe"
                  value={form.TenChuXe}
                  onChange={(e) => onChange("TenChuXe", e.target.value)}
                  required
                />
                <input
                  className="p-2 border rounded"
                  placeholder="Địa chỉ"
                  value={form.DiaChi}
                  onChange={(e) => onChange("DiaChi", e.target.value)}
                  required
                />
                <input
                  className="p-2 border rounded"
                  placeholder="Điện thoại"
                  value={form.DienThoai}
                  onChange={(e) => onChange("DienThoai", e.target.value)}
                  required
                />
                <input
                  className="p-2 border rounded"
                  placeholder="Email"
                  value={form.Email}
                  onChange={(e) => onChange("Email", e.target.value)}
                  required
                />
                {editingId && (
                  <div>
                    <label className="font-semibold">Tiền nợ</label>
                    <input
                      type="number"
                      className="p-2 border rounded w-full"
                      placeholder="Tiền nợ"
                      value={form.TienNo}
                      onChange={(e) =>
                        onChange("TienNo", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* HIEU XE */}
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
                className="p-2 border rounded"
                placeholder="Tên hiệu xe mới"
                value={form.TenHieuXe}
                onChange={(e) => onChange("TenHieuXe", e.target.value)}
              />
            )}
            {/* Xe info */}
            <input
              type="text"
              value={form.BienSo}
              onChange={(e) => onChange("BienSo", e.target.value)}
              placeholder="Biển số"
              className="p-2 border rounded"
            />
            <div>
              <label className="font-semibold">Ngày tiếp nhận</label>
              <input
                type="date"
                className="p-2 border rounded w-full"
                value={form.NgayTiepNhanXeSua}
                onChange={(e) => onChange("NgayTiepNhanXeSua", e.target.value)}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="md:col-span-2 flex gap-3">
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
                        className="px-3 py-1 bg-red-600 text-white rounded mr-2"
                      >
                        Xóa
                      </button>

                      <button
                        onClick={() => printXe(x)}
                        className="px-3 py-1 bg-gray-700 text-white rounded"
                      >
                        In
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
