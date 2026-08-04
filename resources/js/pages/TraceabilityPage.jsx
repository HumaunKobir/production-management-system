import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ModuleGuide from '../components/ModuleGuide';
import PageHeader from '../components/PageHeader';

export default function TraceabilityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState('');
  const [trace, setTrace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracing, setTracing] = useState(false);

  const loadBatches = async () => {
    try {
      setLoading(true);
      const res = await api.getFinishedProductBatches();
      setBatches(res.data);
      if (res.data.length > 0 && !batchId) {
        setBatchId(String(res.data[0].id));
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadBatches();
  }, [user]);

  const handleTrace = async (e) => {
    e.preventDefault();
    if (!batchId) {
      toast.error('Please select a finished product batch.');
      return;
    }
    setTracing(true);
    try {
      const res = await api.traceFinishedBatch(Number(batchId));
      setTrace(res.data);
      toast.success('Trace completed successfully.');
    } catch (err) {
      toast.error(err.message);
      setTrace(null);
    } finally {
      setTracing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Batch Traceability"
        description="Trace a finished product batch back to its semi-finished and raw material sources."
      />

      <ModuleGuide
        title="Traceability"
        items={[
          'Finished product batches appear here after semi-to-finished production completes.',
          'Select a batch from the dropdown (not a production batch ID).',
          'View the full chain: finished batch → production → semi-finished → raw materials.',
          'If the list is empty, run Production (semi → finished) first.',
        ]}
      />

      <section className="card">
        {loading ? (
          <p>Loading finished batches...</p>
        ) : batches.length === 0 ? (
          <p className="empty-state">
            No finished product batches yet. Complete a <strong>Semi-Finished → Finished</strong> production run first,
            then return here to trace it.
          </p>
        ) : (
          <form onSubmit={handleTrace} className="form-stack">
            <label>
              Finished Product Batch *
              <select value={batchId} onChange={(e) => setBatchId(e.target.value)} required>
                <option value="">Select a batch</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number} — {b.product_name} (qty: {b.quantity}, id: {b.id})
                  </option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              <button type="submit" disabled={tracing}>{tracing ? 'Tracing...' : 'Trace Batch'}</button>
              <button type="button" className="btn-secondary" onClick={loadBatches}>Refresh List</button>
            </div>
          </form>
        )}
      </section>

      {trace && (
        <section className="card">
          <h3>Trace Result — {trace.finished_product_batch?.batch_number}</h3>

          <div className="detail-grid" style={{ marginBottom: '1rem' }}>
            <p><strong>Product:</strong> {trace.finished_product_batch?.product?.name}</p>
            <p><strong>SKU:</strong> {trace.finished_product_batch?.product?.sku}</p>
            <p><strong>Quantity:</strong> {trace.finished_product_batch?.quantity}</p>
            <p><strong>Produced:</strong> {trace.finished_product_batch?.produced_at ? new Date(trace.finished_product_batch.produced_at).toLocaleString() : '—'}</p>
          </div>

          {trace.production_batch && (
            <>
              <h4>Production Batch</h4>
              <p>Batch #{trace.production_batch.batch_number} · {trace.production_batch.status} · qty {trace.production_batch.output_quantity}</p>
            </>
          )}

          {trace.semi_finished_sources?.length > 0 && (
            <>
              <h4 style={{ marginTop: '1rem' }}>Semi-Finished Sources</h4>
              <table>
                <thead>
                  <tr><th>Batch</th><th>Product</th><th>Consumed</th></tr>
                </thead>
                <tbody>
                  {trace.semi_finished_sources.map((src, i) => (
                    <tr key={i}>
                      <td>{src.semi_finished_batch?.batch_number}</td>
                      <td>{src.semi_finished_batch?.product?.name}</td>
                      <td>{src.semi_finished_batch?.quantity_consumed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <details style={{ marginTop: '1rem' }}>
            <summary>Full JSON trace data</summary>
            <pre>{JSON.stringify(trace, null, 2)}</pre>
          </details>
        </section>
      )}
    </div>
  );
}
