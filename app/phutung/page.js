"use client";
import { useEffect, useState } from "react";

export default function PhuTung() {
  const [phuTungs, setPhuTungs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ TenPhuTung: "", DonGia: "" });
  const [editingId, setEditingId] = useState(null);

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

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true); setMsg("");
    try {
      const isEditing = editingId !== null;
      const donGiaValue = parseFloat(form.DonGia);
      
      if (!form.TenPhuTung?.trim()) {
        setMsg('Vui lòng nhập tên phụ tùng');
        setLoading(false);
        return;
      }
      
      if (isNaN(donGiaValue) || donGiaValue < 0) {
        setMsg('Vui lòng nhập đơn giá hợp lệ');
        setLoading(false);
        return;
      }
      
      const body = isEditing
        ? { MaPhuTung: editingId, TenPhuTung: form.TenPhuTung.trim(), DonGia: donGiaValue }
        : { TenPhuTung: form.TenPhuTung.trim(), DonGia: donGiaValue };

      console.log('Sending request:', { method: editingId ? 'PUT' : 'POST', body });
      const r = await fetch('/api/phutung', { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await r.json();
      console.log('Response:', { status: r.status, data });
      
      if (!r.ok) { 
        setMsg(data.error || `Lỗi: ${r.status}`); 
        setLoading(false);
        return; 
      }

      // Cập nhật danh sách
      if (isEditing) {
        setPhuTungs(p => p.map(x => x.MaPhuTung === editingId ? data : x));
        setMsg('Cập nhật thành công');
      } else {
        // Thêm mới - reload lại toàn bộ danh sách để có order đúng
        await load();
        setMsg('Thêm thành công');
      }

      setForm({ TenPhuTung: "", DonGia: "" });
      setEditingId(null);
    } catch (e) {
      console.error('Submit error:', e);
      setMsg('Có lỗi xảy ra: ' + e.message);
    } finally { setLoading(false); }
  };

  const edit = (pt) => { setEditingId(pt.MaPhuTung); setForm({ TenPhuTung: pt.TenPhuTung, DonGia: pt.DonGia?.toString?.() || '' }); };

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
      if (editingId === MaPhuTung) { setEditingId(null); setForm({ TenPhuTung: '', DonGia: '' }); }
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
          <input required value={form.TenPhuTung} onChange={e => onChange('TenPhuTung', e.target.value)} placeholder="Tên phụ tùng" className="p-2 border rounded" />
          <input required type="number" min="0" step="1000" value={form.DonGia} onChange={e => onChange('DonGia', e.target.value)} placeholder="Đơn giá" className="p-2 border rounded" />
          <div className="col-span-2 flex gap-2">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded">{editingId ? 'Cập nhật' : 'Thêm'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ TenPhuTung: '', DonGia: '' }); }} className="px-4 py-2 bg-gray-500 text-white rounded">Hủy</button>}
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