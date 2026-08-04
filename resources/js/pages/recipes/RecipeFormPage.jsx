import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { getRecipeType } from '../../config/recipeTypes';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';

export default function RecipeFormPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const config = getRecipeType(type);
  const isEdit = Boolean(id);
  const isSemiToFinished = type === 'semi-to-finished';

  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [form, setForm] = useState({ input_id: '', output_id: '', quantity: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!config) return;

    const load = async () => {
      try {
        if (isSemiToFinished) {
          const [semi, finished] = await Promise.all([api.getSemiFinished(), api.getFinished()]);
          setInputs(semi.data);
          setOutputs(finished.data);
        } else {
          const [raw, semi] = await Promise.all([api.getRawMaterials(), api.getSemiFinished()]);
          setInputs(raw.data);
          setOutputs(semi.data);
        }

        if (isEdit) {
          const res = await config.api.list();
          const recipe = res.data.find((r) => r.id === Number(id));
          if (!recipe) throw new Error('Recipe not found.');
          setForm({
            input_id: String(config.getInputId(recipe)),
            output_id: String(config.getOutputId(recipe)),
            quantity: String(recipe.input_quantity_per_unit),
          });
        }
      } catch (e) {
        toast.error(e.message);
        navigate(config.listPath);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [type, id, config, isEdit, isSemiToFinished, navigate, toast]);

  if (!config) {
    return <p className="error">Invalid recipe type.</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = config.buildBody(form.input_id, form.output_id, form.quantity);
      if (isEdit) {
        await config.api.update(Number(id), body);
        toast.success('Recipe updated successfully.');
      } else {
        await config.api.create(body);
        toast.success('Recipe linked successfully. You can now run production for this product.');
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
        title={isEdit ? `Edit Recipe — ${config.label}` : `Link Products — ${config.label}`}
        description={config.description}
        backTo={config.listPath}
      />

      <section className="card form-page">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <form onSubmit={handleSubmit} className="form-stack">
            <label>
              {config.inputLabel} (consumed) *
              <select
                value={form.input_id}
                onChange={(e) => setForm({ ...form, input_id: e.target.value })}
                required
              >
                <option value="">Select {config.inputLabel.toLowerCase()}</option>
                {inputs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </label>

            <label>
              {config.outputLabel} (produced) *
              <select
                value={form.output_id}
                onChange={(e) => setForm({ ...form, output_id: e.target.value })}
                required
              >
                <option value="">Select {config.outputLabel.toLowerCase()}</option>
                {outputs.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </label>

            <label>
              Input quantity per 1 output unit *
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
              <small className="field-hint">{config.quantityHelp}</small>
            </label>

            {isSemiToFinished && (
              <div className="info-box">
                <strong>Example:</strong> To make Steel Pipes from Steel Rods, select Steel Rods as input,
                Steel Pipes as output, and enter 3 (meaning 3 rods are used per 1 pipe).
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate(config.listPath)}>Cancel</button>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : isEdit ? 'Update Recipe' : 'Link Products'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
