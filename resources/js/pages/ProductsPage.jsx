import { useState } from 'react';
import { api } from '../api';

function ProductTable({ title, items, onCreate, onDelete }) {
  const [form, setForm] = useState({ name: '', sku: '', description: '', unit: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onCreate(form);
    setForm({ name: '', sku: '', description: '', unit: '' });
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
          <tr><th>Name</th><th>SKU</th><th>Unit</th><th>Inventory</th><th></th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.sku}</td>
              <td>{item.unit}</td>
              <td>{item.inventory_quantity ?? 0}</td>
              <td><button type="button" className="danger" onClick={() => onDelete(item.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function ProductsPage() {
  const [raw, setRaw] = useState([]);
  const [semi, setSemi] = useState([]);
  const [finished, setFinished] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
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
    }
  };

  if (!raw.length && !semi.length && !finished.length) {
    return (
      <div>
        <h2>Products</h2>
        <button type="button" onClick={load}>Load Products</button>
        {error && <p className="error">{error}</p>}
      </div>
    );
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
        onDelete={async (id) => { await api.deleteRawMaterial(id); load(); }}
      />
      <ProductTable
        title="Semi-Finished Products"
        items={semi}
        onCreate={async (body) => { await api.createSemiFinished(body); load(); }}
        onDelete={async (id) => { await api.deleteSemiFinished(id); load(); }}
      />
      <ProductTable
        title="Finished Products"
        items={finished}
        onCreate={async (body) => { await api.createFinished(body); load(); }}
        onDelete={async (id) => { await api.deleteFinished(id); load(); }}
      />
    </div>
  );
}
