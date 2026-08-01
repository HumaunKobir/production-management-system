import { useEffect, useState } from 'react';
import { api } from '../api';

export default function InventoryPage() {
  const [inventory, setInventory] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [receiveForm, setReceiveForm] = useState({ raw_material_id: '', quantity: '', batch_number: '' });

  const load = async () => {
    try {
      setError('');
      setLoading(true);
      const res = await api.getInventory();
      setInventory(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleReceive = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.receiveRawMaterial({
        raw_material_id: Number(receiveForm.raw_material_id),
        quantity: Number(receiveForm.quantity),
        batch_number: receiveForm.batch_number || undefined,
      });
      setReceiveForm({ raw_material_id: '', quantity: '', batch_number: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div>
        <h2>Inventory</h2>
        <p>Loading inventory...</p>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div>
        <h2>Inventory</h2>
        <button type="button" onClick={load}>Retry</button>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Inventory</h2>
        <button type="button" onClick={load}>Refresh</button>
      </div>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h3>Receive Raw Materials</h3>
        <form onSubmit={handleReceive} className="form-grid">
          <select
            value={receiveForm.raw_material_id}
            onChange={(e) => setReceiveForm({ ...receiveForm, raw_material_id: e.target.value })}
            required
          >
            <option value="">Select raw material</option>
            {inventory.raw_materials.map((m) => (
              <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Quantity"
            value={receiveForm.quantity}
            onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
            required
          />
          <input
            placeholder="Batch number (optional)"
            value={receiveForm.batch_number}
            onChange={(e) => setReceiveForm({ ...receiveForm, batch_number: e.target.value })}
          />
          <button type="submit">Receive</button>
        </form>
      </section>

      {['raw_materials', 'semi_finished_products', 'finished_products'].map((key) => (
        <section key={key} className="card">
          <h3>{key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Batches</th>
              </tr>
            </thead>
            <tbody>
              {inventory[key].map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unit}</td>
                  <td>{item.batches?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
