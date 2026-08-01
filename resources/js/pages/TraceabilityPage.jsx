import { useState } from 'react';
import { api } from '../api';

export default function TraceabilityPage() {
  const [batchId, setBatchId] = useState('');
  const [trace, setTrace] = useState(null);
  const [error, setError] = useState('');

  const handleTrace = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const res = await api.traceFinishedBatch(Number(batchId));
      setTrace(res.data);
    } catch (err) {
      setError(err.message);
      setTrace(null);
    }
  };

  return (
    <div>
      <h2>Batch Traceability</h2>
      <p>Trace a finished product batch back to its semi-finished and raw material sources.</p>

      <section className="card">
        <form onSubmit={handleTrace} className="form-grid">
          <input
            type="number"
            placeholder="Finished Product Batch ID"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            required
          />
          <button type="submit">Trace</button>
        </form>
        {error && <p className="error">{error}</p>}
      </section>

      {trace && (
        <section className="card">
          <h3>Trace Result</h3>
          <pre>{JSON.stringify(trace, null, 2)}</pre>
        </section>
      )}
    </div>
  );
}
