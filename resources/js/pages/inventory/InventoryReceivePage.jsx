import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';

export default function InventoryReceivePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [materials, setMaterials] = useState([]);
  const [form, setForm] = useState({ raw_material_id: '', quantity: '', batch_number: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getInventory()
      .then((res) => setMaterials(res.data.raw_materials))
      .catch((e) => toast.error(e.message));
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.receiveRawMaterial({
        raw_material_id: Number(form.raw_material_id),
        quantity: Number(form.quantity),
        batch_number: form.batch_number || undefined,
      });
      toast.success('Raw material received successfully.');
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
        title="Receive Raw Material"
        description="Add a new inventory batch for a raw material."
        backTo="/admin/inventory"
      />

      <section className="card form-page">
        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            Raw Material *
            <select value={form.raw_material_id} onChange={(e) => setForm({ ...form, raw_material_id: e.target.value })} required>
              <option value="">Select material</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>
              ))}
            </select>
          </label>
          <label>
            Quantity *
            <input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          </label>
          <label>
            Batch Number (optional)
            <input value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} placeholder="Auto-generated if empty" />
          </label>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/admin/inventory')}>Cancel</button>
            <button type="submit" disabled={submitting}>{submitting ? 'Receiving...' : 'Receive Stock'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
