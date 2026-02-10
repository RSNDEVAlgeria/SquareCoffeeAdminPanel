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
    if (file) setPreview(URL.createObjectURL(file))
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

      let query
      if (product) {
        query = supabase.from("products").update(payload).eq("id", product.id)
      } else {
        query = supabase.from("products").insert(payload)
      }
      const token = `z25Xc8oXLDy0bRHq0yj2whuneV2m7kt9RlVPt9IVtmEzOdIqI2`;
      const { error } = await query
      if (error) throw error
      await fetch("https://square-coffee-cache.squarecoffeedem.workers.dev/purge", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
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
      <div className="bg-white p-6 rounded-lg w-[95%] max-w-md space-y-3">
        <h2 className="text-xl font-bold">{product ? "Edit" : "Add"} Product</h2>

        <input
          type="text"
          className="input"
          placeholder="Title"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
        />
         <input
          type="number"
          className="input"
          placeholder="Price"
          value={form.price}
          onChange={e => setForm({ ...form, price: e.target.value })}
        />
        <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="" disabled>Select Type</option>
            <option value="Option1">Salty food</option>
            <option value="Option3">Sweet food</option>
            <option value="Option2">Drink</option>
        </select>
        <label className="block mt-2">
          <span className="text-sm text-gray-600">Product Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="mt-1"
          />
        </label>

        {preview && (
          <img src={preview} className="h-40 w-full object-cover rounded mt-2" />
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={close} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={loading} className="btn-primary">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}
