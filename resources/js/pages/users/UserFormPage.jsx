import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/PageHeader';

const emptyForm = { name: '', email: '', password: '', role: 'operator' };

export default function UserFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) {
      setForm(emptyForm);
      setLoading(false);
      return;
    }
    api.getUsers()
      .then((res) => {
        const user = res.data.find((u) => u.id === Number(id));
        if (!user) throw new Error('User not found.');
        setForm({ name: user.name, email: user.email, password: '', role: user.role });
      })
      .catch((e) => {
        toast.error(e.message);
        navigate('/admin/users');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = { name: form.name, email: form.email, role: form.role };
      if (form.password) body.password = form.password;
      if (isEdit) {
        if (!form.password) delete body.password;
        await api.updateUser(Number(id), body);
        toast.success('User updated successfully.');
      } else {
        if (!form.password) throw new Error('Password is required for new users.');
        await api.createUser(form);
        toast.success('User created successfully.');
      }
      navigate('/admin/users');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={isEdit ? 'Edit User' : 'Create User'}
        description={isEdit ? 'Update account details. Leave password blank to keep current.' : 'Add a new system user with a role.'}
        backTo="/admin/users"
      />

      <section className="card form-page">
        {loading ? <p>Loading...</p> : (
          <form onSubmit={handleSubmit} className="form-stack">
            <label>Name *<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Email *<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
            <label>Password {isEdit ? '(leave blank to keep)' : '*'}
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!isEdit} />
            </label>
            <label>Role *
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="operator">Operator</option>
              </select>
            </label>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => navigate('/admin/users')}>Cancel</button>
              <button type="submit" disabled={submitting}>{submitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
