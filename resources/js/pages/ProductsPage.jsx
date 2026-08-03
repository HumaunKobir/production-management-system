import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', sku: '', description: '', unit: '' };

function ProductTable({ title, items, onCreate, onUpdate, onDelete }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onCreate(form);
    setForm(emptyForm);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      sku: item.sku,
      description: item.description || '',
      unit: item.unit || '',
    });
  };

  const saveEdit = async () => {
    await onUpdate(editingId, editForm);
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await onDelete(id);
  };

  return (
    <section className="card">
      <h3>{title}</h3>
      <form onSubmit={handleSubmit} className="form-grid">
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
        <input placeholder="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button type="submit">Add</button>
      </form>
      <table>
        <thead>
          <tr><th>Name</th><th>SKU</th><th>Unit</th><th>Description</th><th>Inventory</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              {editingId === item.id ? (
                <>
                  <td><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                  <td><input value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} /></td>
                  <td><input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} /></td>
                  <td><input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></td>
                  <td>{item.inventory_quantity ?? 0}</td>
                  <td className="actions">
                    <button type="button" onClick={saveEdit}>Save</button>
                    <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.unit}</td>
                  <td>{item.description}</td>
                  <td>{item.inventory_quantity ?? 0}</td>
                  <td className="actions">
                    <button type="button" className="btn-secondary" onClick={() => startEdit(item)}>Edit</button>
                    <button type="button" className="danger" onClick={() => handleDelete(item.id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [raw, setRaw] = useState([]);
  const [semi, setSemi] = useState([]);
  const [finished, setFinished] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setError('');
      setLoading(true);
      const [r, s, f] = await Promise.all([
        api.getRawMaterials(),
        api.getSemiFinished(),
        api.getFinished(),
      ]);
      setRaw(r.data);
      setSemi(s.data);
      setFinished(f.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  if (loading) {
    return <div><h2>Products</h2><p>Loading products...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Products</h2>
        <button type="button" onClick={load}>Refresh</button>
      </div>
      {error && <p className="error">{error}</p>}
      <ProductTable
        title="Raw Materials"
        items={raw}
        onCreate={async (body) => { await api.createRawMaterial(body); load(); }}
        onUpdate={async (id, body) => { await api.updateRawMaterial(id, body); load(); }}
        onDelete={async (id) => { await api.deleteRawMaterial(id); load(); }}
      />
      <ProductTable
        title="Semi-Finished Products"
        items={semi}
        onCreate={async (body) => { await api.createSemiFinished(body); load(); }}
        onUpdate={async (id, body) => { await api.updateSemiFinished(id, body); load(); }}
        onDelete={async (id) => { await api.deleteSemiFinished(id); load(); }}
      />
      <ProductTable
        title="Finished Products"
        items={finished}
        onCreate={async (body) => { await api.createFinished(body); load(); }}
        onUpdate={async (id, body) => { await api.updateFinished(id, body); load(); }}
        onDelete={async (id) => { await api.deleteFinished(id); load(); }}
      />
    </div>
  );
}
