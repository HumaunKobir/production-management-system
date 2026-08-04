import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import FilterBar from '../../components/FilterBar';
import ModuleGuide from '../../components/ModuleGuide';
import PageHeader from '../../components/PageHeader';
import { useListFilter } from '../../hooks/useListFilter';

export default function UsersListPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');

  const load = () => {
    setLoading(true);
    api.getUsers()
      .then((res) => setUsers(res.data))
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (currentUser) load(); }, [currentUser]);

  const baseItems = roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter);
  const { search, setSearch, filtered } = useListFilter(baseItems, {
    searchKeys: ['name', 'email', 'role_label'],
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.deleteUser(id);
      toast.success('User deleted successfully.');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Create and manage admin, manager, and operator accounts."
        actions={
          <div className="page-actions">
            <button type="button" className="btn-secondary" onClick={load}>Refresh</button>
            <Link to="/admin/users/create" className="btn-link">+ Create User</Link>
          </div>
        }
      />

      <ModuleGuide
        title="Users module"
        items={[
          'List all users with search and role filter.',
          'Create users on a dedicated page (name, email, password, role).',
          'Edit users on a separate page (optional password change).',
          'Delete users except your own account.',
          'Roles: Admin (full access), Manager (products + production), Operator (production only).',
        ]}
      />

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name or email..."
        filters={[{
          key: 'role',
          label: 'Role',
          value: roleFilter,
          onChange: setRoleFilter,
          options: [
            { value: 'all', label: 'All roles' },
            { value: 'admin', label: 'Administrator' },
            { value: 'manager', label: 'Manager' },
            { value: 'operator', label: 'Operator' },
          ],
        }]}
      />

      <section className="card">
        {loading ? <p>Loading users...</p> : (
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="empty-state">No users match your filters.</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className="role-badge">{u.role_label}</span></td>
                  <td className="actions">
                    <Link to={`/admin/users/${u.id}/edit`} className="btn-link-sm">Edit</Link>
                    {u.id !== currentUser?.id && (
                      <button type="button" className="danger btn-sm" onClick={() => handleDelete(u.id)}>Delete</button>
                    )}
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
