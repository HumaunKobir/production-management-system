import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'operator' });

  const load = () => {
    api.getUsers()
      .then((res) => setUsers(res.data))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    if (user) {
      load();
    }
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.createUser(form);
      setForm({ name: '', email: '', password: '', role: 'operator' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
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
            <tr><th>Name</th><th>Email</th><th>Role</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td><span className="role-badge">{user.role_label}</span></td>
                <td><button type="button" className="danger" onClick={() => handleDelete(user.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
