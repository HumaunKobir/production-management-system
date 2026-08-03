import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = {
  pending: ['processing', 'failed'],
  processing: ['failed'],
  failed: ['pending'],
  completed: [],
};

export default function ProductionPage() {
  const { user, can } = useAuth();
  const canManage = can('manage_products');
  const [history, setHistory] = useState([]);
  const [semiProducts, setSemiProducts] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [rawToSemi, setRawToSemi] = useState({ semi_finished_product_id: '', output_quantity: '', batch_number: '', notes: '' });
  const [semiToFinished, setSemiToFinished] = useState({ finished_product_id: '', output_quantity: '', batch_number: '', notes: '' });

  const load = async () => {
    try {
      setError('');
      setLoading(true);
      const [h, semi, finished] = await Promise.all([
        api.getProductionHistory(),
        api.getSemiFinished(),
        api.getFinished(),
      ]);
      setHistory(h.data);
      setSemiProducts(semi.data);
      setFinishedProducts(finished.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const viewBatch = async (id) => {
    try {
      const res = await api.getProductionBatch(id);
      setSelected({ ...res.data.production_batch, events: res.data.events });
    } catch (e) {
      setError(e.message);
    }
  };

  const submitRawToSemi = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      const res = await api.startRawToSemi({
        semi_finished_product_id: Number(rawToSemi.semi_finished_product_id),
        output_quantity: Number(rawToSemi.output_quantity),
        batch_number: rawToSemi.batch_number || undefined,
        notes: rawToSemi.notes || undefined,
      });
      setMessage(res.message);
      setRawToSemi({ semi_finished_product_id: '', output_quantity: '', batch_number: '', notes: '' });
      setTimeout(load, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  const submitSemiToFinished = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setMessage('');
      const res = await api.startSemiToFinished({
        finished_product_id: Number(semiToFinished.finished_product_id),
        output_quantity: Number(semiToFinished.output_quantity),
        batch_number: semiToFinished.batch_number || undefined,
        notes: semiToFinished.notes || undefined,
      });
      setMessage(res.message);
      setSemiToFinished({ finished_product_id: '', output_quantity: '', batch_number: '', notes: '' });
      setTimeout(load, 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  const changeStatus = async (batch, newStatus) => {
    try {
      setError('');
      setMessage('');
      const res = await api.updateProductionStatus(batch.id, newStatus);
      setMessage(res.message);
      load();
      if (selected?.id === batch.id) {
        viewBatch(batch.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteBatch = async (id) => {
    if (!window.confirm('Delete this production batch?')) return;
    try {
      setError('');
      await api.deleteProductionBatch(id);
      setMessage('Production batch deleted.');
      if (selected?.id === id) setSelected(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateNotes = async (batch, notes) => {
    try {
      setError('');
      await api.updateProductionBatch(batch.id, { notes });
      setMessage('Notes updated.');
      load();
      viewBatch(batch.id);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  if (loading) {
    return <div><h2>Production</h2><p>Loading production data...</p></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Production</h2>
        <button type="button" onClick={load}>Refresh</button>
      </div>
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      <section className="card">
        <h3>Raw Material → Semi-Finished</h3>
        <form onSubmit={submitRawToSemi} className="form-grid">
          <select
            value={rawToSemi.semi_finished_product_id}
            onChange={(e) => setRawToSemi({ ...rawToSemi, semi_finished_product_id: e.target.value })}
            required
          >
            <option value="">Select semi-finished product</option>
            {semiProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" step="0.01" placeholder="Output quantity" value={rawToSemi.output_quantity} onChange={(e) => setRawToSemi({ ...rawToSemi, output_quantity: e.target.value })} required />
          <input placeholder="Batch number (optional)" value={rawToSemi.batch_number} onChange={(e) => setRawToSemi({ ...rawToSemi, batch_number: e.target.value })} />
          <input placeholder="Notes" value={rawToSemi.notes} onChange={(e) => setRawToSemi({ ...rawToSemi, notes: e.target.value })} />
          <button type="submit">Start Production</button>
        </form>
      </section>

      <section className="card">
        <h3>Semi-Finished → Finished</h3>
        <form onSubmit={submitSemiToFinished} className="form-grid">
          <select
            value={semiToFinished.finished_product_id}
            onChange={(e) => setSemiToFinished({ ...semiToFinished, finished_product_id: e.target.value })}
            required
          >
            <option value="">Select finished product</option>
            {finishedProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input type="number" step="0.01" placeholder="Output quantity" value={semiToFinished.output_quantity} onChange={(e) => setSemiToFinished({ ...semiToFinished, output_quantity: e.target.value })} required />
          <input placeholder="Batch number (optional)" value={semiToFinished.batch_number} onChange={(e) => setSemiToFinished({ ...semiToFinished, batch_number: e.target.value })} />
          <input placeholder="Notes" value={semiToFinished.notes} onChange={(e) => setSemiToFinished({ ...semiToFinished, notes: e.target.value })} />
          <button type="submit">Start Production</button>
        </form>
      </section>

      <section className="card">
        <h3>Production History</h3>
        <table>
          <thead>
            <tr>
              <th>Batch #</th>
              <th>Type</th>
              <th>Status</th>
              <th>Qty</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {history.map((batch) => (
              <tr key={batch.id}>
                <td>{batch.batch_number}</td>
                <td>{batch.type}</td>
                <td>
                  {canManage && STATUS_OPTIONS[batch.status]?.length > 0 ? (
                    <select
                      value={batch.status}
                      onChange={(e) => changeStatus(batch, e.target.value)}
                      className="status-select"
                    >
                      <option value={batch.status}>{batch.status}</option>
                      {STATUS_OPTIONS[batch.status].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`status ${batch.status}`}>{batch.status}</span>
                  )}
                </td>
                <td>{batch.output_quantity}</td>
                <td>{new Date(batch.production_timestamp).toLocaleString()}</td>
                <td className="actions">
                  <button type="button" className="btn-secondary" onClick={() => viewBatch(batch.id)}>Details</button>
                  {canManage && ['pending', 'failed'].includes(batch.status) && (
                    <button type="button" className="danger" onClick={() => deleteBatch(batch.id)}>Delete</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected && (
        <section className="card">
          <h3>Batch Details — {selected.batch_number}</h3>
          <div className="detail-grid">
            <p><strong>Type:</strong> {selected.type}</p>
            <p><strong>Status:</strong> <span className={`status ${selected.status}`}>{selected.status}</span></p>
            <p><strong>Output Qty:</strong> {selected.output_quantity}</p>
            {selected.failure_reason && <p className="error"><strong>Failure:</strong> {selected.failure_reason}</p>}
          </div>
          {canManage && (
            <div className="form-grid" style={{ marginTop: '1rem' }}>
              <input
                placeholder="Update notes"
                defaultValue={selected.notes || ''}
                id="batch-notes-input"
              />
              <button type="button" onClick={() => {
                const notes = document.getElementById('batch-notes-input').value;
                updateNotes(selected, notes);
              }}>Save Notes</button>
            </div>
          )}
          {selected.events?.length > 0 && (
            <>
              <h4 style={{ marginTop: '1rem' }}>Events</h4>
              <table>
                <thead><tr><th>Time</th><th>Type</th><th>Message</th></tr></thead>
                <tbody>
                  {selected.events.map((ev, i) => (
                    <tr key={i}>
                      <td>{new Date(ev.created_at).toLocaleString()}</td>
                      <td>{ev.event_type}</td>
                      <td>{ev.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <button type="button" className="btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setSelected(null)}>Close</button>
        </section>
      )}
    </div>
  );
}
