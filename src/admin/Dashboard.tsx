import { Link, Outlet, useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabase"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

function DashboardStats() {
  const [stats, setStats] = useState({ products: 0 })

  useEffect(() => {
    async function fetchStats() {
      const { count: p } = await supabase.from('products').select('*', { count: 'exact', head: true })
      setStats({products: p || 0 })
    }
    fetchStats()
  }, [])

  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Products Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="p-8">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Products</p>
                <p className="text-4xl md:text-5xl font-black text-gray-900 mt-2">{stats.products}</p>
              </div>
              <div className="text-3xl md:text-4xl bg-orange-50 p-4 rounded-xl text-orange-500">📦</div>
            </div>
          </div>
          <Link to="products" className="block bg-orange-600 py-4 text-center text-white font-bold hover:bg-orange-700 transition">
            Manage Inventory
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const nav = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    toast.success("Logged out")
    nav("/admin/login")
  }

  const isIndex = location.pathname === "/admin/dashboard" || location.pathname === "/admin/dashboard/";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
      
      {/* MOBILE TOP BAR - Visible only on Mobile */}
      <div className="md:hidden bg-gray-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <h1 className="font-bold text-orange-500">ADMIN PANEL</h1>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-gray-800 rounded-lg text-orange-500 focus:outline-none"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 transition-transform duration-300 ease-in-out
        fixed md:relative z-40 w-72 h-full min-h-screen bg-gray-900 text-white p-8 flex flex-col shadow-xl
      `}>
        <Link 
          to="/admin/dashboard" 
          onClick={() => setIsMobileMenuOpen(false)}
          className="text-2xl font-black text-orange-500 mb-12 hover:text-orange-400 transition"
        >
          ADMIN PANEL
        </Link>

        <nav className="flex-1 space-y-3">
          <Link 
            to="products" 
            onClick={() => setIsMobileMenuOpen(false)}
            className={`block py-3 px-4 rounded-lg font-medium transition ${location.pathname.includes('products') ? 'bg-orange-600 text-white' : 'hover:bg-gray-800'}`}
          >
            Products
          </Link>
        </nav>

        <button 
          onClick={logout} 
          className="mt-auto py-3 px-4 border border-red-500/50 text-red-400 rounded-lg font-bold hover:bg-red-600 hover:text-white transition"
        >
          Sign Out
        </button>
      </aside>

      {/* MOBILE OVERLAY - Closes menu when clicking outside */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
        {isIndex ? <DashboardStats /> : <Outlet />}
      </main>
    </div>
  )
}