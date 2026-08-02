import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ProductionPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [semiProducts, setSemiProducts] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rawToSemi, setRawToSemi] = useState({ semi_finished_product_id: '', output_quantity: '', notes: '' });
  const [semiToFinished, setSemiToFinished] = useState({ finished_product_id: '', output_quantity: '', notes: '' });

  const load = async () => {
    try {
      setError('');
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
    }
  };

  const viewBatch = async (id) => {
    try {
      const res = await api.getProductionBatch(id);
      setSelected(res.data);
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
        notes: rawToSemi.notes || undefined,
      });
      setMessage(res.message);
      setTimeout(load, 2000);
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
        notes: semiToFinished.notes || undefined,
      });
      setMessage(res.message);
      setTimeout(load, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  if (!history.length && !semiProducts.length && !error) {
    return (
      <div>
        <h2>Production</h2>
        <button type="button" onClick={load}>Load Production</button>
        {error && <p className="error">{error}</p>}
      </div>
    );
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
          <input
            type="number"
            step="0.01"
            placeholder="Output quantity"
            value={rawToSemi.output_quantity}
            onChange={(e) => setRawToSemi({ ...rawToSemi, output_quantity: e.target.value })}
            required
          />
          <input
            placeholder="Notes"
            value={rawToSemi.notes}
            onChange={(e) => setRawToSemi({ ...rawToSemi, notes: e.target.value })}
          />
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
          <input
            type="number"
            step="0.01"
            placeholder="Output quantity"
            value={semiToFinished.output_quantity}
            onChange={(e) => setSemiToFinished({ ...semiToFinished, output_quantity: e.target.value })}
            required
          />
          <input
            placeholder="Notes"
            value={semiToFinished.notes}
            onChange={(e) => setSemiToFinished({ ...semiToFinished, notes: e.target.value })}
          />
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {history.map((batch) => (
              <tr key={batch.id}>
                <td>{batch.batch_number}</td>
                <td>{batch.type}</td>
                <td><span className={`status ${batch.status}`}>{batch.status}</span></td>
                <td>{batch.output_quantity}</td>
                <td>{new Date(batch.production_timestamp).toLocaleString()}</td>
                <td><button type="button" onClick={() => viewBatch(batch.id)}>Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected && (
        <section className="card">
          <h3>Batch Details</h3>
          <pre>{JSON.stringify(selected, null, 2)}</pre>
          <button type="button" onClick={() => setSelected(null)}>Close</button>
        </section>
      )}
    </div>
  );
}
