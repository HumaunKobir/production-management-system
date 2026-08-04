import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';

export default function InventoryBatchFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ batch_number: '', remaining_quantity: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getInventory()
      .then((res) => {
        const batch = res.data.raw_materials
          .flatMap((m) => m.batches.map((b) => ({ ...b, materialName: m.name })))
          .find((b) => b.id === Number(id));
        if (!batch) throw new Error('Batch not found.');
        setForm({
          batch_number: batch.batch_number,
          remaining_quantity: String(batch.remaining_quantity),
        });
      })
      .catch((e) => {
        toast.error(e.message);
        navigate('/admin/inventory');
      })
      .finally(() => setLoading(false));
  }, [id, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.updateRawMaterialBatch(Number(id), {
        batch_number: form.batch_number,
        remaining_quantity: Number(form.remaining_quantity),
      });
      toast.success('Batch updated successfully.');
      navigate('/admin/inventory');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Edit Inventory Batch"
        description="Update batch number or remaining quantity."
        backTo="/admin/inventory"
      />

      <section className="card form-page">
        {loading ? <p>Loading...</p> : (
          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              Batch Number *
              <input value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} required />
            </label>
            <label>
              Remaining Quantity *
              <input type="number" step="0.01" value={form.remaining_quantity} onChange={(e) => setForm({ ...form, remaining_quantity: e.target.value })} required />
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/admin/inventory')}>Cancel</button>
              <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Update Batch'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
