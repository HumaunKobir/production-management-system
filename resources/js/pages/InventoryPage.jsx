import { Fragment, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function InventoryPage() {
  const { user, can } = useAuth();
  const canManage = can('manage_products');
  const [inventory, setInventory] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [receiveForm, setReceiveForm] = useState({ raw_material_id: '', quantity: '', batch_number: '' });
  const [expandedItem, setExpandedItem] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchForm, setBatchForm] = useState({ batch_number: '', remaining_quantity: '' });

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
    if (user) {
      load();
    }
  }, [user]);

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

  const startEditBatch = (batch) => {
    setEditingBatch(batch.id);
    setBatchForm({
      batch_number: batch.batch_number,
      remaining_quantity: String(batch.remaining_quantity),
    });
  };

  const saveBatch = async () => {
    try {
      setError('');
      await api.updateRawMaterialBatch(editingBatch, {
        batch_number: batchForm.batch_number,
        remaining_quantity: Number(batchForm.remaining_quantity),
      });
      setEditingBatch(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteBatch = async (id) => {
    if (!window.confirm('Delete this inventory batch?')) return;
    try {
      setError('');
      await api.deleteRawMaterialBatch(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div><h2>Inventory</h2><p>Loading inventory...</p></div>;
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
          <input type="number" step="0.01" placeholder="Quantity" value={receiveForm.quantity} onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })} required />
          <input placeholder="Batch number (optional)" value={receiveForm.batch_number} onChange={(e) => setReceiveForm({ ...receiveForm, batch_number: e.target.value })} />
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inventory[key].map((item) => (
                <Fragment key={item.id}>
                  <tr>
                    <td>{item.name}</td>
                    <td>{item.sku}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>{item.batches?.length || 0}</td>
                    <td>
                      {item.batches?.length > 0 && (
                        <button type="button" className="btn-secondary" onClick={() => setExpandedItem(expandedItem === `${key}-${item.id}` ? null : `${key}-${item.id}`)}>
                          {expandedItem === `${key}-${item.id}` ? 'Hide' : 'View'} Batches
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedItem === `${key}-${item.id}` && item.batches?.length > 0 && (
                    <tr>
                      <td colSpan={6}>
                        <table className="nested-table">
                          <thead>
                            <tr>
                              <th>Batch #</th>
                              <th>Remaining</th>
                              <th>Date</th>
                              {key === 'raw_materials' && canManage && <th>Actions</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {item.batches.map((batch) => (
                              <tr key={batch.id}>
                                {editingBatch === batch.id ? (
                                  <>
                                    <td><input value={batchForm.batch_number} onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })} /></td>
                                    <td><input type="number" step="0.01" value={batchForm.remaining_quantity} onChange={(e) => setBatchForm({ ...batchForm, remaining_quantity: e.target.value })} /></td>
                                    <td>{batch.received_at ? new Date(batch.received_at).toLocaleDateString() : '—'}</td>
                                    <td className="actions">
                                      <button type="button" onClick={saveBatch}>Save</button>
                                      <button type="button" className="btn-secondary" onClick={() => setEditingBatch(null)}>Cancel</button>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td>{batch.batch_number}</td>
                                    <td>{batch.remaining_quantity ?? batch.quantity}</td>
                                    <td>{(batch.received_at || batch.produced_at) ? new Date(batch.received_at || batch.produced_at).toLocaleDateString() : '—'}</td>
                                    {key === 'raw_materials' && canManage && (
                                      <td className="actions">
                                        <button type="button" className="btn-secondary" onClick={() => startEditBatch(batch)}>Edit</button>
                                        <button type="button" className="danger" onClick={() => deleteBatch(batch.id)}>Delete</button>
                                      </td>
                                    )}
                                  </>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
