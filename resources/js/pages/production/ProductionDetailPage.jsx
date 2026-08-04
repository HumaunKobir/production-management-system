import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';

const STATUS_OPTIONS = {
  pending: ['processing', 'failed'],
  processing: ['failed'],
  failed: ['pending'],
  completed: [],
};

export default function ProductionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = useAuth();
  const { toast } = useToast();
  const canManage = can('manage_products');
  const [batch, setBatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.getProductionBatch(id);
      setBatch(res.data.production_batch);
      setEvents(res.data.events || []);
      setNotes(res.data.production_batch?.notes || '');
    } catch (e) {
      toast.error(e.message);
      navigate('/admin/production');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const changeStatus = async (newStatus) => {
    try {
      const res = await api.updateProductionStatus(id, newStatus);
      toast.success(res.message || 'Status updated.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      await api.updateProductionBatch(id, { notes });
      toast.success('Notes updated successfully.');
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading batch details...</p>;
  if (!batch) return null;

  return (
    <div>
      <PageHeader
        title={`Batch ${batch.batch_number}`}
        description={`${batch.type} · ${batch.status}`}
        backTo="/admin/production"
      />

      <section className="card">
        <div className="detail-grid">
          <p><strong>Type:</strong> {batch.type}</p>
          <p><strong>Status:</strong> <span className={`status ${batch.status}`}>{batch.status}</span></p>
          <p><strong>Output Qty:</strong> {batch.output_quantity}</p>
          <p><strong>Started:</strong> {new Date(batch.production_timestamp).toLocaleString()}</p>
          {batch.completed_at && <p><strong>Completed:</strong> {new Date(batch.completed_at).toLocaleString()}</p>}
          {batch.failure_reason && <p className="error"><strong>Failure:</strong> {batch.failure_reason}</p>}
        </div>

        {canManage && STATUS_OPTIONS[batch.status]?.length > 0 && (
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <span>Change status:</span>
            {STATUS_OPTIONS[batch.status].map((s) => (
              <button key={s} type="button" className="btn-secondary btn-sm" onClick={() => changeStatus(s)}>
                → {s}
              </button>
            ))}
          </div>
        )}
      </section>

      {canManage && (
        <section className="card form-page">
          <h3>Notes</h3>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          <div className="form-actions">
            <button type="button" onClick={saveNotes} disabled={saving}>{saving ? 'Saving...' : 'Save Notes'}</button>
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="card">
          <h3>Event Log</h3>
          <table>
            <thead><tr><th>Time</th><th>Type</th><th>Message</th></tr></thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={i}>
                  <td>{new Date(ev.created_at).toLocaleString()}</td>
                  <td>{ev.event_type}</td>
                  <td>{ev.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <Link to="/admin/production" className="btn-link">← Back to production list</Link>
    </div>
  );
}
