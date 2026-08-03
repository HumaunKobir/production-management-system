import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', email: '', password: '', role: 'operator' };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', password: '', role: 'operator' });

  const load = () => {
    api.getUsers()
      .then((res) => setUsers(res.data))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    if (currentUser) {
      load();
    }
  }, [currentUser]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.createUser(form);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, password: '', role: user.role });
  };

  const handleUpdate = async () => {
    try {
      setError('');
      const body = { name: editForm.name, email: editForm.email, role: editForm.role };
      if (editForm.password) {
        body.password = editForm.password;
      }
      await api.updateUser(editingId, body);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      setError('');
      await api.deleteUser(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>User Management</h2>
        <button type="button" onClick={load}>Refresh</button>
      </div>
      {error && <p className="error">{error}</p>}

      <section className="card">
        <h3>Create User</h3>
        <form onSubmit={handleCreate} className="form-grid">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="admin">Administrator</option>
            <option value="manager">Manager</option>
            <option value="operator">Operator</option>
          </select>
          <button type="submit">Create User</button>
        </form>
      </section>

      <section className="card">
        <h3>All Users</h3>
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                {editingId === user.id ? (
                  <>
                    <td><input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></td>
                    <td><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></td>
                    <td>
                      <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                        <option value="admin">Administrator</option>
                        <option value="manager">Manager</option>
                        <option value="operator">Operator</option>
                      </select>
                    </td>
                    <td className="actions">
                      <input type="password" placeholder="New password (optional)" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                      <button type="button" onClick={handleUpdate}>Save</button>
                      <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td><span className="role-badge">{user.role_label}</span></td>
                    <td className="actions">
                      <button type="button" className="btn-secondary" onClick={() => startEdit(user)}>Edit</button>
                      {user.id !== currentUser?.id && (
                        <button type="button" className="danger" onClick={() => handleDelete(user.id)}>Delete</button>
                      )}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
