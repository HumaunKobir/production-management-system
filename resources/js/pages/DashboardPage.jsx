import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard()
      .then((res) => setData(res.data))
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!data) {
    return <p>Loading dashboard...</p>;
  }

  const { stats, recent_production } = data;

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{stats.raw_materials}</span>
          <span className="stat-label">Raw Materials</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.semi_finished_products}</span>
          <span className="stat-label">Semi-Finished</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.finished_products}</span>
          <span className="stat-label">Finished Products</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{stats.completed_batches}</span>
          <span className="stat-label">Completed Batches</span>
        </div>
      </div>

      <section className="card">
        <h3>Recent Production</h3>
        {recent_production.length === 0 ? (
          <p>No production batches yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Batch #</th>
                <th>Type</th>
                <th>Status</th>
                <th>Qty</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recent_production.map((batch) => (
                <tr key={batch.id}>
                  <td>{batch.batch_number}</td>
                  <td>{batch.type}</td>
                  <td><span className={`status ${batch.status}`}>{batch.status}</span></td>
                  <td>{batch.output_quantity}</td>
                  <td>{new Date(batch.production_timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Link to="/admin/production" className="link-btn">View all production →</Link>
      </section>
    </div>
  );
}
