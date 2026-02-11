import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import ProductModal from "./ProductModal"
import toast from "react-hot-toast"
import Loader from "../components/Loader"

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [edit, setEdit] = useState<any>(null)

  async function loadProducts() {
    setLoading(true)
    const { data, error } = await supabase
      .from("products")
      .select("id,name,price,image_url,type")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error(error.message)
    } else {
      setProducts(data || [])
    }
    setLoading(false)
  }

  async function del(id: string) {
    if (!confirm("Delete product?")) return
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) return toast.error(error.message)
    const token = import.meta.env.VITE_TOKEN_WORKER;
      
    const purgeResponse = await fetch("https://square-coffee-cache.squarecoffeedem.workers.dev/purge", {method: "POST",headers: {"Authorization": `Bearer ${token}`,"Content-Type": "application/json"}});
      
            if (!purgeResponse.ok) {
              const errorText = await purgeResponse.text();
              console.error("Purge failed:", errorText);
              toast.error("Cache update failed, but data saved.")
            }
    toast.success("Product deleted")
    loadProducts()
  }

  useEffect(() => { loadProducts() }, [])

  if (loading) return <Loader />

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => { setEdit(null); setModalOpen(true) }}
          className="btn-primary w-full sm:w-auto"
        >
          + Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col transition-all hover:shadow-md">
            <img src={p.image_url} className="h-48 w-full object-cover rounded-lg" />
            <div className="flex-1">
              <h2 className="font-bold mt-4 text-lg text-gray-800">{p.title}</h2>
              <p className="text-orange-600 font-bold">{p.price} DA</p>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => { setEdit(p); setModalOpen(true) }} className="btn-secondary flex-1">
                Edit
              </button>
              <button onClick={() => del(p.id)} className="btn-danger flex-1">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <ProductModal
          product={edit}
          close={() => { setModalOpen(false); setEdit(null) }}
          reload={loadProducts}
        />
      )}
    </div>
  )
}