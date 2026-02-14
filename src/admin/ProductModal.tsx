import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { supabase } from "../lib/supabase"
import { uploadToCloudinary } from "../lib/cloudinary"

interface ProductModalProps {
  product?: any
  close: () => void
  reload: () => void
}

export default function ProductModal({ product, close, reload }: ProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(product?.image_url || "")
  const [form, setForm] = useState({
    name: product?.name || "",
    price: product?.price || "",
    type: product?.type || "",
    image_url: product?.image_url || "",
  })

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setPreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  async function save() {
    if (!form.name || (!form.image_url && !file)) {
      return toast.error("Title and image are required")
    }

    try {
      setLoading(true)

      let imageUrl = form.image_url
      if (file) imageUrl = await uploadToCloudinary(file)

      const payload = { ...form, image_url: imageUrl }

      // 1. Update Supabase
      const { error } = product 
        ? await supabase.from("products").update(payload).eq("id", product.id)
        : await supabase.from("products").insert(payload);
      
      if (error) throw error

      // 2. Trigger Worker Purge
      const token = import.meta.env.VITE_TOKEN_WORKER;

      const purgeResponse = await fetch("https://assets.squarecoffee.shop/purge", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!purgeResponse.ok) {
        const errorText = await purgeResponse.text();
        console.error("Purge failed:", errorText);
        // We toast a warning but don't stop the flow since the DB updated
        toast.error("Cache update failed, but data saved.")
      }

      toast.success(product ? "Product updated" : "Product added")
      reload()
      close()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-[95%] max-w-md space-y-3 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-800">{product ? "Edit" : "Add"} Product</h2>

        <div className="space-y-4">
          <input
            type="text"
            className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-orange-900"
            placeholder="Title"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="number"
            className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-orange-900"
            placeholder="Price"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
          />
          <select 
            className="w-full p-2 border rounded outline-none focus:ring-2 focus:ring-orange-900" 
            value={form.type} 
            onChange={e => setForm({ ...form, type: e.target.value })}
          >
            <option value="" disabled>Select Type</option>
            <option value="Option1">Salty food</option>
            <option value="Option3">Sweet food</option>
            <option value="Option2">Drink</option>
          </select>

          <div className="border-2 border-dashed border-gray-200 p-4 rounded text-center">
             <span className="text-xs text-gray-500 block mb-2">Image File</span>
             <input
               type="file"
               accept="image/*"
               onChange={e => setFile(e.target.files?.[0] || null)}
               className="text-xs"
             />
          </div>

          {preview && (
            <img src={preview} className="h-40 w-full object-cover rounded mt-2 border" />
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={close} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button 
            onClick={save} 
            disabled={loading} 
            className="px-4 py-2 bg-orange-900 text-white rounded hover:bg-orange-800 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
