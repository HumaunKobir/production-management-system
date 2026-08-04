import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RECIPE_TYPES } from '../../config/recipeTypes';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../../components/FilterBar';
import ModuleGuide from '../../components/ModuleGuide';
import PageHeader from '../../components/PageHeader';
import { useListFilter } from '../../hooks/useListFilter';

export default function RecipesListPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      const [rawSemi, semiFinished] = await Promise.all([
        RECIPE_TYPES['raw-to-semi'].api.list(),
        RECIPE_TYPES['semi-to-finished'].api.list(),
      ]);
      const merged = [
        ...rawSemi.data.map((r) => ({ ...r, recipeType: 'raw-to-semi' })),
        ...semiFinished.data.map((r) => ({ ...r, recipeType: 'semi-to-finished' })),
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

  const base = typeFilter === 'all' ? items : items.filter((i) => i.recipeType === typeFilter);
  const { search, setSearch, filtered } = useListFilter(base, {
    searchKeys: ['input_quantity_per_unit'],
  });

  const displaySearch = (item) => {
    const cfg = RECIPE_TYPES[item.recipeType];
    return `${cfg.getInputName(item)} ${cfg.getOutputName(item)}`;
  };

  const searchFiltered = search.trim()
    ? filtered.filter((item) => displaySearch(item).toLowerCase().includes(search.toLowerCase()))
    : filtered;

  const handleDelete = async (item) => {
    if (!window.confirm('Delete this recipe?')) return;
    try {
      await RECIPE_TYPES[item.recipeType].api.delete(item.id);
      toast.success('Recipe deleted.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Recipes (BOM)"
        description="Link products together so production knows which materials to consume."
        actions={
          <div className="page-actions">
            <button type="button" className="btn-secondary" onClick={load}>Refresh</button>
            <Link to="/admin/recipes/raw-to-semi/create" className="btn-link">+ Raw → Semi</Link>
            <Link to="/admin/recipes/semi-to-finished/create" className="btn-link">+ Semi → Finished</Link>
          </div>
        }
      />

      <ModuleGuide
        title="How to link a finished product"
        items={[
          'Step 1: Create products in Products (raw, semi-finished, finished).',
          'Step 2: Add a Raw → Semi recipe (which raw material makes which semi product).',
          'Step 3: Add a Semi → Finished recipe — select your semi-finished product as INPUT and your new finished product as OUTPUT.',
          'Step 4: Set quantity per unit (e.g. 3 rods per 1 pipe).',
          'Step 5: Run production — the system will use these recipes automatically.',
        ]}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by product names..."
        filters={[{
          key: 'type',
          label: 'Recipe type',
          value: typeFilter,
          onChange: setTypeFilter,
          options: [
            { value: 'all', label: 'All recipes' },
            { value: 'raw-to-semi', label: 'Raw → Semi-Finished' },
            { value: 'semi-to-finished', label: 'Semi → Finished' },
          ],
        }]}
      />

      <section className="card">
        {loading ? (
          <p>Loading recipes...</p>
        ) : searchFiltered.length === 0 ? (
          <p className="empty-state">No recipes found. Create one to link your products for production.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Input</th>
                <th>Output</th>
                <th>Qty per unit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {searchFiltered.map((item) => {
                const cfg = RECIPE_TYPES[item.recipeType];
                return (
                  <tr key={`${item.recipeType}-${item.id}`}>
                    <td><span className="type-badge">{cfg.label}</span></td>
                    <td>{cfg.getInputName(item)}</td>
                    <td>{cfg.getOutputName(item)}</td>
                    <td>{item.input_quantity_per_unit}</td>
                    <td className="actions">
                      <Link to={cfg.editPath(item.id)} className="btn-link-sm">Edit</Link>
                      <button type="button" className="danger btn-sm" onClick={() => handleDelete(item)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
