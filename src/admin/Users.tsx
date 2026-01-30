import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import toast from "react-hot-toast"
import Loader from "../components/Loader"
import UserModal from "./UserModal"

const PAGE_SIZE = 100

export default function Users() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [searchEmail, setSearchEmail] = useState("")
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  async function load(isNewSearch = false) {
    if (isNewSearch) {
      setLoading(true)
      setPage(0)
    } else {
      setLoadingMore(true)
    }

    try {
      const currentPage = isNewSearch ? 0 : page
      const from = currentPage * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      let query = supabase
        .from("profiles")
        .select("id, email, name, balance")
        .range(from, to)
        .order('email', { ascending: true })

      if (searchEmail.trim()) {
        query = query.ilike("email", `%${searchEmail.trim()}%`)
      }

      const { data, error } = await query

      if (error) throw error

      if (isNewSearch) {
        setUsers(data || [])
      } else {
        setUsers(prev => [...prev, ...(data || [])])
      }

      // If we got fewer results than the page size, we reached the end
      setHasMore(data?.length === PAGE_SIZE)
      
      if (!isNewSearch) {
        setPage(currentPage + 1)
      } else {
        setPage(1)
      }

    } catch (err: any) {
      toast.error(err.message || "Failed to load users.")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  async function del(id: string) {
    if (!confirm("Are you sure? This will delete the Auth account AND the profile.")) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error("Not authenticated")

      const { error } = await supabase.functions.invoke("delete-user", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { user_id: id },
      })

      if (error) throw error

      toast.success("User deleted successfully")
      // Reset and reload to ensure list is accurate
      await load(true)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(true)
  }, [])

  // Trigger search when user presses Enter or clears the field
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      load(true)
    }
  }

  if (loading && users.length === 0) return <Loader />

  return (
    <div className="max-w-6xl mx-auto">
      {selectedUser && (
        <UserModal
          user={selectedUser}
          close={() => setSelectedUser(null)}
          reload={() => load(true)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        
        <div className="flex w-full sm:w-auto gap-2">
          <input 
            type="text"
            placeholder="Search by email..."
            className="text-sm border border-gray-300 rounded-lg px-4 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <button
            onClick={() => load(true)}
            className="text-sm bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg transition"
          >
            Search
          </button>
          <button
            onClick={() => {
              setSearchEmail("");
              load(true);
            }}
            className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg transition"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-125">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-semibold text-gray-600">User Details</th>
                <th className="p-4 font-semibold text-gray-600">Balance</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12 text-gray-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{u.name || "N/A"}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="p-4 text-green-600 font-bold whitespace-nowrap">
                      {u.balance?.toLocaleString()} DA
                    </td>
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-md text-sm font-bold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => del(u.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-md text-sm font-bold transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && users.length > 0 && (
        <div className="mt-6 flex justify-center pb-10">
          <button
            onClick={() => load(false)}
            disabled={loadingMore}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2 px-6 rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load More Users"}
          </button>
        </div>
      )}
    </div>
  )
}