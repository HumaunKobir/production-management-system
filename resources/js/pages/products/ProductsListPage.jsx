import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { PRODUCT_TYPES } from '../../config/productTypes';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../../components/FilterBar';
import ModuleGuide from '../../components/ModuleGuide';
import PageHeader from '../../components/PageHeader';
import { useListFilter } from '../../hooks/useListFilter';

export default function ProductsListPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      const [raw, semi, finished] = await Promise.all([
        api.getRawMaterials(),
        api.getSemiFinished(),
        api.getFinished(),
      ]);
      const merged = [
        ...raw.data.map((i) => ({ ...i, productType: 'raw' })),
        ...semi.data.map((i) => ({ ...i, productType: 'semi' })),
        ...finished.data.map((i) => ({ ...i, productType: 'finished' })),
      ];
      setItems(merged);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const { search, setSearch, filtered } = useListFilter(
    typeFilter === 'all' ? items : items.filter((i) => i.productType === typeFilter),
    { searchKeys: ['name', 'sku', 'description', 'unit'] }
  );

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await PRODUCT_TYPES[item.productType].api.delete(item.id);
      toast.success('Product deleted successfully.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage raw materials, semi-finished, and finished products."
        actions={
          <div className="page-actions">
            <button type="button" className="btn-secondary" onClick={load}>Refresh</button>
            <Link to="/admin/products/raw/create" className="btn-link">+ Raw Material</Link>
            <Link to="/admin/products/semi/create" className="btn-link">+ Semi-Finished</Link>
            <Link to="/admin/products/finished/create" className="btn-link">+ Finished</Link>
          </div>
        }
      />

      <ModuleGuide
        title="Products module"
        items={[
          'List all products in one table with search and type filter.',
          'Create separate product types via dedicated create pages.',
          'Edit any product on its own edit page (name, SKU, unit, description).',
          'Delete products from the list (with confirmation).',
          'Inventory quantity is shown read-only per product.',
        ]}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, SKU, unit..."
        filters={[{
          key: 'type',
          label: 'Product type',
          value: typeFilter,
          onChange: setTypeFilter,
          options: [
            { value: 'all', label: 'All types' },
            { value: 'raw', label: 'Raw Materials' },
            { value: 'semi', label: 'Semi-Finished' },
            { value: 'finished', label: 'Finished' },
          ],
        }]}
      />

      <section className="card">
        {loading ? (
          <p>Loading products...</p>
        ) : filtered.length === 0 ? (
          <p className="empty-state">No products match your filters.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Unit</th>
                <th>Inventory</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={`${item.productType}-${item.id}`}>
                  <td><span className="type-badge">{PRODUCT_TYPES[item.productType].label}</span></td>
                  <td>{item.name}</td>
                  <td>{item.sku}</td>
                  <td>{item.unit}</td>
                  <td>{item.inventory_quantity ?? 0}</td>
                  <td className="actions">
                    <Link to={PRODUCT_TYPES[item.productType].editPath(item.id)} className="btn-link-sm">Edit</Link>
                    <button type="button" className="danger btn-sm" onClick={() => handleDelete(item)}>Delete</button>
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
