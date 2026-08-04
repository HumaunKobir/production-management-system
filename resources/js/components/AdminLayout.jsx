import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, logout, can } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>PMS</h1>
        <p className="subtitle">Admin Panel</p>
        <nav>
          <NavLink to="/admin" end>Dashboard</NavLink>
          <NavLink to="/admin/inventory">Inventory</NavLink>
          {can('manage_products') && <NavLink to="/admin/products">Products</NavLink>}
          {can('manage_products') && <NavLink to="/admin/recipes">Recipes</NavLink>}
          <NavLink to="/admin/production">Production</NavLink>
          <NavLink to="/admin/traceability">Traceability</NavLink>
          {can('manage_users') && <NavLink to="/admin/users">Users</NavLink>}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <strong>{user?.name}</strong>
            <span>{user?.role_label}</span>
          </div>
          <button type="button" className="btn-outline" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
