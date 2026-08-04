import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';

export default function ProductionFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [semiProducts, setSemiProducts] = useState([]);
  const [finishedProducts, setFinishedProducts] = useState([]);
  const [productionType, setProductionType] = useState('raw_to_semi');
  const [form, setForm] = useState({
    product_id: '',
    output_quantity: '',
    batch_number: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([api.getSemiFinished(), api.getFinished()])
      .then(([semi, finished]) => {
        setSemiProducts(semi.data);
        setFinishedProducts(finished.data);
      })
      .catch((e) => toast.error(e.message));
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        output_quantity: Number(form.output_quantity),
        batch_number: form.batch_number || undefined,
        notes: form.notes || undefined,
      };
      let res;
      if (productionType === 'raw_to_semi') {
        res = await api.startRawToSemi({
          ...body,
          semi_finished_product_id: Number(form.product_id),
        });
      } else {
        res = await api.startSemiToFinished({
          ...body,
          finished_product_id: Number(form.product_id),
        });
      }
      toast.success(res.message || 'Production batch queued.');
      navigate('/admin/production');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const products = productionType === 'raw_to_semi' ? semiProducts : finishedProducts;

  return (
    <div>
      <PageHeader
        title="Start Production"
        description="Queue a new production batch. Processing runs asynchronously via RabbitMQ."
        backTo="/admin/production"
      />

      <section className="card form-page">
        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            Production Type *
            <select
              value={productionType}
              onChange={(e) => {
                setProductionType(e.target.value);
                setForm({ ...form, product_id: '' });
              }}
            >
              <option value="raw_to_semi">Raw Material → Semi-Finished</option>
              <option value="semi_to_finished">Semi-Finished → Finished</option>
            </select>
          </label>
          <label>
            Output Product *
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              required
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </label>
          <label>
            Output Quantity *
            <input type="number" step="0.01" value={form.output_quantity} onChange={(e) => setForm({ ...form, output_quantity: e.target.value })} required />
          </label>
          <label>
            Batch Number (optional)
            <input value={form.batch_number} onChange={(e) => setForm({ ...form, batch_number: e.target.value })} placeholder="Auto-generated if empty" />
          </label>
          <label>
            Notes
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </label>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/admin/production')}>Cancel</button>
            <button type="submit" disabled={submitting}>{submitting ? 'Starting...' : 'Start Production'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
