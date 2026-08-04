import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import ToastContainer from './components/ToastContainer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsListPage from './pages/products/ProductsListPage';
import ProductFormPage from './pages/products/ProductFormPage';
import UsersListPage from './pages/users/UsersListPage';
import UserFormPage from './pages/users/UserFormPage';
import ProductionListPage from './pages/production/ProductionListPage';
import ProductionFormPage from './pages/production/ProductionFormPage';
import ProductionDetailPage from './pages/production/ProductionDetailPage';
import InventoryListPage from './pages/inventory/InventoryListPage';
import InventoryReceivePage from './pages/inventory/InventoryReceivePage';
import InventoryBatchFormPage from './pages/inventory/InventoryBatchFormPage';
import RecipesListPage from './pages/recipes/RecipesListPage';
import RecipeFormPage from './pages/recipes/RecipeFormPage';
import TraceabilityPage from './pages/TraceabilityPage';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ToastContainer />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />

              <Route path="inventory" element={<InventoryListPage />} />
              <Route path="inventory/receive" element={
                <ProtectedRoute permission="execute_production"><InventoryReceivePage /></ProtectedRoute>
              } />
              <Route path="inventory/batches/:id/edit" element={
                <ProtectedRoute permission="manage_products"><InventoryBatchFormPage /></ProtectedRoute>
              } />

              <Route path="products" element={
                <ProtectedRoute permission="manage_products"><ProductsListPage /></ProtectedRoute>
              } />
              <Route path="products/:type/create" element={
                <ProtectedRoute permission="manage_products"><ProductFormPage /></ProtectedRoute>
              } />
              <Route path="products/:type/:id/edit" element={
                <ProtectedRoute permission="manage_products"><ProductFormPage /></ProtectedRoute>
              } />

              <Route path="recipes" element={
                <ProtectedRoute permission="manage_products"><RecipesListPage /></ProtectedRoute>
              } />
              <Route path="recipes/:type/create" element={
                <ProtectedRoute permission="manage_products"><RecipeFormPage /></ProtectedRoute>
              } />
              <Route path="recipes/:type/:id/edit" element={
                <ProtectedRoute permission="manage_products"><RecipeFormPage /></ProtectedRoute>
              } />

              <Route path="production" element={<ProductionListPage />} />
              <Route path="production/create" element={
                <ProtectedRoute permission="execute_production"><ProductionFormPage /></ProtectedRoute>
              } />
              <Route path="production/:id" element={<ProductionDetailPage />} />

              <Route path="traceability" element={<TraceabilityPage />} />

              <Route path="users" element={
                <ProtectedRoute permission="manage_users"><UsersListPage /></ProtectedRoute>
              } />
              <Route path="users/create" element={
                <ProtectedRoute permission="manage_users"><UserFormPage /></ProtectedRoute>
              } />
              <Route path="users/:id/edit" element={
                <ProtectedRoute permission="manage_users"><UserFormPage /></ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
