"use client";
import { useEffect, useState } from "react";

// Hàm định dạng tiền tệ và ngày tháng
const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v || 0);
const dateFmt = (d) => (d ? d.split("T")[0] : "");

export default function ThuTienDocLap() {
  const [phieus, setPhieus] = useState([]);
  const [chuxes, setChuxes] = useState([]);
  const [printData, setPrintData] = useState(null); // 1. State lưu dữ liệu in

  const [form, setForm] = useState({
    MaChuXe: "",
    NgayThuTien: dateFmt(new Date().toISOString()),
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
      const [dataPhieu, dataChu] = await Promise.all([
        rPhieu.json(),
        rChu.json(),
      ]);
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
      const { MaChuXe, NgayThuTien, SoTienThu } = form;
      if (!MaChuXe || !NgayThuTien || !SoTienThu) {
        setMsg("Vui lòng nhập đầy đủ thông tin");
        setLoading(false);
        return;
      }

      const soTienThuFloat = parseFloat(SoTienThu);
      const currentChuXe = chuxes.find(
        (c) => Number(c.MaChuXe) === Number(MaChuXe)
      );
      const tienNoHienTai = Number(currentChuXe?.TienNo || 0);

      if (soTienThuFloat > Math.abs(tienNoHienTai) && tienNoHienTai != 0) {
        setMsg(
          `Số tiền thu (${fmt(
            soTienThuFloat
          )} VND) không được vượt quá số nợ (${fmt(tienNoHienTai)} VND).`
        );
        setLoading(false);
        return;
      }

      const body = {
        MaPhieuThuTien: editingId,
        MaChuXe: parseInt(MaChuXe),
        NgayThuTien,
        SoTienThu: soTienThuFloat,
      };

      const r = await fetch("/api/thutien", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const resData = await r.json();

      if (!r.ok) {
        throw new Error(resData.error || "Lỗi lưu phiếu");
      }
      await load();
      setMsg(editingId ? "Cập nhật thành công" : "Thêm thành công");
      setForm({
        MaChuXe: "",
        NgayThuTien: dateFmt(new Date().toISOString()),
        SoTienThu: "",
      });
      setEditingId(null);
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Hàm xử lý in tương tự trang Xe
  const handlePrint = (p) => {
    setPrintData(p);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <>
      {/* 3. CSS Style dành riêng cho việc in ấn */}
      <style jsx global>{`
        #print-area {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area,
          #print-area * {
            visibility: visible;
          }
          #print-area {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>

      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Thu tiền</h1>

        {/* Form Thu Tiền */}
        <section className="bg-white p-6 rounded-lg shadow-md mb-6">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Chọn chủ xe */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">
                  Chủ xe
                </label>
                <select
                  value={form.MaChuXe}
                  onChange={(e) => onChange("MaChuXe", e.target.value)}
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none"
                >
                  <option value="">Chọn chủ xe</option>
                  {chuxes.map((c) => (
                    <option key={c.MaChuXe} value={c.MaChuXe}>
                      {c.TenChuXe} (Nợ: {fmt(c.TienNo)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngày thu */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">
                  Ngày thu tiền
                </label>
                <input
                  type="date"
                  value={form.NgayThuTien}
                  onChange={(e) => onChange("NgayThuTien", e.target.value)}
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>

              {/* Số tiền */}
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-gray-600">
                  Số tiền thu (VNĐ)
                </label>
                <input
                  type="number"
                  step={1000}
                  value={form.SoTienThu}
                  onChange={(e) => onChange("SoTienThu", e.target.value)}
                  placeholder="Ví dụ: 500000"
                  className="p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none"
                />
              </div>
            </div>

            {/* Nút bấm nằm riêng biệt ở dưới các ô nhập liệu */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-2 rounded font-bold text-white transition-all ${
                  editingId
                    ? "bg-orange-500 hover:bg-orange-600"
                    : "bg-blue-600 hover:bg-blue-700"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading
                  ? "Đang xử lý..."
                  : editingId
                  ? "Cập nhật phiếu"
                  : "Xác nhận thu tiền"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      MaChuXe: "",
                      NgayThuTien: dateFmt(new Date().toISOString()),
                      SoTienThu: "",
                    });
                  }}
                  className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-all"
                >
                  Hủy bỏ
                </button>
              )}
            </div>

            {msg && (
              <div
                className={`text-sm font-medium ${
                  msg.includes("Lỗi") || msg.includes("không")
                    ? "text-red-500"
                    : "text-green-600"
                }`}
              >
                {msg}
              </div>
            )}
          </form>
        </section>

        {/* Danh sách phiếu thu */}
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl mb-3 font-semibold">
            Danh sách phiếu thu tiền
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Mã</th>
                  <th className="border p-2">Chủ xe</th>
                  <th className="border p-2">Ngày thu</th>
                  <th className="border p-2">Số tiền</th>
                  <th className="border p-2 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {phieus.map((p) => (
                  <tr key={p.MaPhieuThuTien}>
                    <td className="border p-2">{p.MaPhieuThuTien}</td>
                    <td className="border p-2">{p.ChuXe?.TenChuXe}</td>
                    <td className="border p-2">{dateFmt(p.NgayThuTien)}</td>
                    <td className="border p-2">{fmt(p.SoTienThu)}</td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handlePrint(p)}
                        className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-black"
                      >
                        In
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Vùng hiển thị nội dung phiếu thu khi in */}
        {printData && (
          <div id="print-area">
            <h2 className="text-2xl font-bold text-center mb-8">
              PHIẾU THU TIỀN
            </h2>
            <div className="space-y-4 text-lg">
              <p>
                <b>Mã phiếu thu:</b> {printData.MaPhieuThuTien}
              </p>
              <p>
                <b>Họ tên chủ xe:</b> {printData.ChuXe?.TenChuXe}
              </p>
              <p>
                <b>Địa chỉ:</b>{" "}
                {printData.ChuXe?.DiaChi ||
                  "........................................................"}
              </p>
              <p>
                <b>Điện thoại:</b>{" "}
                {printData.ChuXe?.DienThoai ||
                  "................................"}
              </p>
              <p>
                <b>Ngày thu tiền:</b> {dateFmt(printData.NgayThuTien)}
              </p>
              <p>
                <b>Số tiền thu:</b>{" "}
                <span className="text-xl font-bold">
                  {fmt(printData.SoTienThu)} VNĐ
                </span>
              </p>
            </div>

            <div className="mt-12 flex justify-between px-10">
              <div className="text-center">
                <p className="font-semibold">Người nộp tiền</p>
                <p className="italic text-sm">(Ký và ghi rõ họ tên)</p>
              </div>
              <div className="text-center">
                <p className="font-semibold">Người thu tiền</p>
                <p className="italic text-sm">(Ký và ghi rõ họ tên)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
