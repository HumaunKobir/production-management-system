import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getProductType } from '../../config/productTypes';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';

const emptyForm = { name: '', sku: '', description: '', unit: '' };

export default function ProductFormPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const config = getProductType(type);
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!config) return;
    if (!isEdit) {
      setForm(emptyForm);
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const res = await config.api.list();
        const item = res.data.find((p) => p.id === Number(id));
        if (!item) throw new Error('Product not found.');
        setForm({
          name: item.name,
          sku: item.sku,
          description: item.description || '',
          unit: item.unit || '',
        });
      } catch (e) {
        toast.error(e.message);
        navigate(config.listPath);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type, id, config, isEdit, navigate, toast]);

  if (!config) {
    return <p className="error">Invalid product type.</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        await config.api.update(Number(id), form);
        toast.success(`${config.label} updated successfully.`);
      } else {
        await config.api.create(form);
        toast.success(`${config.label} created successfully.`);
      }
      navigate(config.listPath);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? `Edit ${config.label}` : `Create ${config.label}`}
        description={isEdit ? 'Update product details below.' : `Add a new ${config.label.toLowerCase()} to the catalog.`}
        backTo={config.listPath}
      />

      <section className="card form-page">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              Name *
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              SKU *
              <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
            </label>
            <label>
              Unit
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. kg, units" />
            </label>
            <label>
              Description
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate(config.listPath)}>Cancel</button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
