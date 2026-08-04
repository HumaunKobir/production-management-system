import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../../components/FilterBar';
import ModuleGuide from '../../components/ModuleGuide';
import PageHeader from '../../components/PageHeader';
import { useListFilter } from '../../hooks/useListFilter';

export default function InventoryListPage() {
  const { user, can } = useAuth();
  const { toast } = useToast();
  const canManage = can('manage_products');
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.getInventory();
      setInventory(res.data);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const flatItems = inventory ? [
    ...inventory.raw_materials.map((i) => ({ ...i, category: 'raw_materials', categoryLabel: 'Raw Material' })),
    ...inventory.semi_finished_products.map((i) => ({ ...i, category: 'semi_finished_products', categoryLabel: 'Semi-Finished' })),
    ...inventory.finished_products.map((i) => ({ ...i, category: 'finished_products', categoryLabel: 'Finished' })),
  ] : [];

  const base = categoryFilter === 'all' ? flatItems : flatItems.filter((i) => i.category === categoryFilter);
  const { search, setSearch, filtered } = useListFilter(base, {
    searchKeys: ['name', 'sku', 'unit'],
  });

  const deleteBatch = async (batchId) => {
    if (!window.confirm('Delete this inventory batch?')) return;
    try {
      await api.deleteRawMaterialBatch(batchId);
      toast.success('Batch deleted successfully.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="View stock levels across all production stages."
        actions={
          <div className="page-actions">
            <button type="button" className="btn-secondary" onClick={load}>Refresh</button>
            <Link to="/admin/inventory/receive" className="btn-link">+ Receive Raw Material</Link>
          </div>
        }
      />

      <ModuleGuide
        title="Inventory module"
        items={[
          'List inventory by category with search and filters.',
          'Receive raw materials on a dedicated create page.',
          'Expand rows to view batch-level stock.',
          'Edit or delete raw material batches (admin/manager).',
          'Semi-finished and finished stock is updated via production.',
        ]}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or SKU..."
        filters={[{
          key: 'category',
          label: 'Category',
          value: categoryFilter,
          onChange: setCategoryFilter,
          options: [
            { value: 'all', label: 'All categories' },
            { value: 'raw_materials', label: 'Raw Materials' },
            { value: 'semi_finished_products', label: 'Semi-Finished' },
            { value: 'finished_products', label: 'Finished' },
          ],
        }]}
      />

      <section className="card">
        {loading ? <p>Loading inventory...</p> : (
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Batches</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">No inventory matches your filters.</td></tr>
              ) : filtered.map((item) => (
                <Fragment key={`${item.category}-${item.id}`}>
                  <tr>
                    <td><span className="type-badge">{item.categoryLabel}</span></td>
                    <td>{item.name}</td>
                    <td>{item.sku}</td>
                    <td>{item.quantity}</td>
                    <td>{item.unit}</td>
                    <td>{item.batches?.length || 0}</td>
                    <td>
                      {item.batches?.length > 0 && (
                        <button
                          type="button"
                          className="btn-secondary btn-sm"
                          onClick={() => setExpandedId(expandedId === `${item.category}-${item.id}` ? null : `${item.category}-${item.id}`)}
                        >
                          {expandedId === `${item.category}-${item.id}` ? 'Hide' : 'Batches'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandedId === `${item.category}-${item.id}` && item.batches?.length > 0 && (
                    <tr>
                      <td colSpan={7}>
                        <table className="nested-table">
                          <thead>
                            <tr><th>Batch #</th><th>Remaining</th><th>Date</th>{canManage && item.category === 'raw_materials' && <th>Actions</th>}</tr>
                          </thead>
                          <tbody>
                            {item.batches.map((batch) => (
                              <tr key={batch.id}>
                                <td>{batch.batch_number}</td>
                                <td>{batch.remaining_quantity ?? batch.quantity}</td>
                                <td>{(batch.received_at || batch.produced_at) ? new Date(batch.received_at || batch.produced_at).toLocaleDateString() : '—'}</td>
                                {canManage && item.category === 'raw_materials' && (
                                  <td className="actions">
                                    <Link to={`/admin/inventory/batches/${batch.id}/edit`} className="btn-link-sm">Edit</Link>
                                    <button type="button" className="danger btn-sm" onClick={() => deleteBatch(batch.id)}>Delete</button>
                                  </td>
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
        )}
      </section>
    </div>
  );
}
