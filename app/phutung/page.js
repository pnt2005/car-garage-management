"use client";
import { useEffect, useState } from "react";

export default function PhuTung() {
  const [phuTungs, setPhuTungs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ MaPhuTung: "", TenPhuTung: "", DonGia: "" });
  const [editingId, setEditingId] = useState(null);
  const [maConflict, setMaConflict] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/phutung");
      const data = await r.json();
      if (r.ok) setPhuTungs(data || []);
      else setMsg(data.error || "Lỗi khi lấy danh sách");
    } catch (e) {
      console.error(e);
      setMsg("Lỗi khi lấy danh sách");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onChange = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    if (k === "MaPhuTung") {
      const exists = phuTungs.some(p => (p.MaPhuTung?.toString?.() || "") === v);
      const editingMatch = editingId && editingId.toString() === v;
      setMaConflict(!!(v && exists && !editingMatch));
    }
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (maConflict) { setMsg('Mã đã tồn tại'); return; }
    setLoading(true); setMsg("");
    try {
      const isEditing = editingId !== null;
      const body = isEditing
        ? { MaPhuTung: editingId, TenPhuTung: (form.TenPhuTung || '').trim(), DonGia: parseFloat(form.DonGia) }
        : (() => {
            const o = { TenPhuTung: (form.TenPhuTung || '').trim(), DonGia: parseFloat(form.DonGia) };
            if (form.MaPhuTung) o.MaPhuTung = form.MaPhuTung; // allow string shown client-side
            return o;
          })();

      const r = await fetch('/api/phutung', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) { setMsg(data.error || 'Lỗi'); return; }

      setMsg(editingId ? 'Cập nhật thành công' : 'Thêm thành công');
      // Update list (show entered MaPhuTung string immediately for new items)
      if (editingId) setPhuTungs(p => p.map(x => x.MaPhuTung === editingId ? data : x));
      else setPhuTungs(p => {
        const d = { ...data };
        if (form.MaPhuTung) d.MaPhuTung = form.MaPhuTung;
        return [...p, d];
      });

      setForm({ MaPhuTung: "", TenPhuTung: "", DonGia: "" });
      setEditingId(null);
      setMaConflict(false);
    } catch (e) {
      console.error(e);
      setMsg('Có lỗi xảy ra');
    } finally { setLoading(false); }
  };

  const edit = (pt) => { setEditingId(pt.MaPhuTung); setForm({ MaPhuTung: pt.MaPhuTung?.toString?.() || '', TenPhuTung: pt.TenPhuTung, DonGia: pt.DonGia?.toString?.() || '' }); setMaConflict(false); };

  const del = async (MaPhuTung) => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;
    setLoading(true); setMsg("");
    const prev = phuTungs;
    setPhuTungs(p => p.filter(x => x.MaPhuTung !== MaPhuTung));
    try {
      const r = await fetch('/api/phutung', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ MaPhuTung }) });
      const data = await r.json();
      if (!r.ok) { setMsg(data.error || 'Lỗi khi xóa'); setPhuTungs(prev); }
      else setMsg('Xóa thành công');
      if (editingId === MaPhuTung) { setEditingId(null); setForm({ MaPhuTung: '', TenPhuTung: '', DonGia: '' }); }
    } catch (e) { console.error(e); setMsg('Lỗi khi xóa'); setPhuTungs(prev); }
    finally { setLoading(false); }
  };

  const fmt = v => new Intl.NumberFormat('vi-VN').format(v || 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Quản lý phụ tùng</h1>

      <section className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl mb-3">{editingId ? 'Cập nhật' : 'Thêm'} phụ tùng</h2>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          {!editingId && (
            <div>
              <input value={form.MaPhuTung} onChange={e => onChange('MaPhuTung', e.target.value)} className={`w-full p-2 border rounded ${maConflict ? 'border-red-500' : ''}`} placeholder="Nhập mã phụ tùng" />
              {maConflict && <div className="text-red-600 text-sm">Mã đã tồn tại</div>}
            </div>
          )}
          <input required value={form.TenPhuTung} onChange={e => onChange('TenPhuTung', e.target.value)} placeholder="Tên phụ tùng" className="p-2 border rounded" />
          <input required type="number" min="0" step="1000" value={form.DonGia} onChange={e => onChange('DonGia', e.target.value)} placeholder="Đơn giá" className="p-2 border rounded" />
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={loading || maConflict} className="px-4 py-2 bg-blue-500 text-white rounded">{editingId ? 'Cập nhật' : 'Thêm'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ MaPhuTung: '', TenPhuTung: '', DonGia: '' }); setMaConflict(false); }} className="px-4 py-2 bg-gray-500 text-white rounded">Hủy</button>}
          </div>
          {msg && <div className="col-span-2 text-green-600">{msg}</div>}
        </form>
      </section>

      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl mb-3">Danh sách phụ tùng</h2>
        {phuTungs.length === 0 ? <p className="text-gray-500">Chưa có phụ tùng</p> : (
          <table className="w-full border-collapse border">
            <thead><tr className="bg-gray-100"><th className="border px-2 py-1">Mã</th><th className="border px-2 py-1">Tên</th><th className="border px-2 py-1">Đơn giá</th><th className="border px-2 py-1">Thao tác</th></tr></thead>
            <tbody>
              {phuTungs.map(pt => (
                <tr key={pt.MaPhuTung} className={editingId === pt.MaPhuTung ? 'bg-blue-50' : ''}>
                  <td className="border px-2 py-1">{pt.MaPhuTung}</td>
                  <td className="border px-2 py-1">{pt.TenPhuTung}</td>
                  <td className="border px-2 py-1 text-right">{fmt(pt.DonGia)}₫</td>
                  <td className="border px-2 py-1 text-center">
                    <button onClick={() => edit(pt)} className="px-3 py-1 bg-teal-500 text-white rounded mr-2">Sửa</button>
                    <button onClick={() => del(pt.MaPhuTung)} className="px-3 py-1 bg-red-500 text-white rounded">Xóa</button>
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