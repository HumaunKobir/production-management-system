import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../../components/FilterBar';
import ModuleGuide from '../../components/ModuleGuide';
import PageHeader from '../../components/PageHeader';
import { useListFilter } from '../../hooks/useListFilter';

const STATUS_OPTIONS = {
  pending: ['processing', 'failed'],
  processing: ['failed'],
  failed: ['pending'],
  completed: [],
};

export default function ProductionListPage() {
  const { user, can } = useAuth();
  const { toast } = useToast();
  const canManage = can('manage_products');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.getProductionHistory();
      setHistory(res.data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  let base = history;
  if (statusFilter !== 'all') base = base.filter((b) => b.status === statusFilter);
  if (typeFilter !== 'all') base = base.filter((b) => b.type === typeFilter);

  const { search, setSearch, filtered } = useListFilter(base, {
    searchKeys: ['batch_number', 'type', 'status', 'notes'],
  });

  const changeStatus = async (batch, newStatus) => {
    try {
      const res = await api.updateProductionStatus(batch.id, newStatus);
      toast.success(res.message || 'Status updated.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deleteBatch = async (id) => {
    if (!window.confirm('Delete this production batch?')) return;
    try {
      await api.deleteProductionBatch(id);
      toast.success('Production batch deleted.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Production"
        description="View production history, start new batches, and manage status."
        actions={
          <div className="page-actions">
            <button type="button" className="btn-secondary" onClick={load}>Refresh</button>
            <Link to="/admin/production/create" className="btn-link">+ Start Production</Link>
          </div>
        }
      />

      <ModuleGuide
        title="Production module"
        items={[
          'List all production batches with search, status, and type filters.',
          'Start new production on a dedicated create page (raw→semi or semi→finished).',
          'Change batch status from the list (pending, processing, failed, retry).',
          'View full batch details and event log on the detail page.',
          'Delete pending or failed batches (admin/manager).',
        ]}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search batch number, notes..."
        filters={[
          {
            key: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All statuses' },
              { value: 'pending', label: 'Pending' },
              { value: 'processing', label: 'Processing' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
            ],
          },
          {
            key: 'type',
            label: 'Type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: 'all', label: 'All types' },
              { value: 'raw_to_semi', label: 'Raw → Semi' },
              { value: 'semi_to_finished', label: 'Semi → Finished' },
            ],
          },
        ]}
      />

      <section className="card">
        {loading ? <p>Loading production history...</p> : (
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
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No batches match your filters.</td></tr>
              ) : filtered.map((batch) => (
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
                    <Link to={`/admin/production/${batch.id}`} className="btn-link-sm">View</Link>
                    {canManage && ['pending', 'failed'].includes(batch.status) && (
                      <button type="button" className="danger btn-sm" onClick={() => deleteBatch(batch.id)}>Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
