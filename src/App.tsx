import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./admin/Login"
import Dashboard from "./admin/Dashboard"
import Products from "./admin/Products"
import AdminRoute from "./admin/AdminRoute" // Ensure this matches your filename

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Entry points */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        
        {/* Public Route */}
        <Route path="/admin/login" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        >
          {/* Leave index as null. 
            Dashboard.tsx uses isIndex to show stats when path is exactly /admin/dashboard 
          */}
          <Route index element={null} />
          <Route path="products" element={<Products />} />
        </Route>

        {/* Global Fallback */}
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}