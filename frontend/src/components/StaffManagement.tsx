import React, { useEffect, useState } from "react";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  resetPassword,
} from "../api/staff.api";
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Shield,
  Key,
} from "lucide-react";
import Pagination from "./Pagination";

export default function StaffManagement() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [search, setSearch] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("RM");

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const { data } = await getStaff();
      setStaffList(data);
    } catch (e) {
      console.error(e);
      alert("Failed to load staff list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("RM");
    setIsModalOpen(true);
  };

  const openEditModal = (staff: any) => {
    setEditingId(staff.id);
    setName(staff.name);
    setEmail(staff.email);
    setPassword(""); // leave blank for edit unless we want to change it (not implemented fully for security but UI is here)
    setRole(staff.role);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateStaff(editingId, { name, email, role });
      } else {
        await createStaff({ name, email, password, role });
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || "Failed to save staff member");
    }
  };

  const handleResetPassword = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to reset ${name}'s password to '0000'?`,
      )
    ) {
      try {
        await resetPassword(id);
        alert(`Password for ${name} has been successfully reset to 0000`);
      } catch (error: any) {
        console.error(error);
        alert(error.response?.data?.error || "Failed to reset password");
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteStaff(id);
        fetchStaff();
      } catch (e: any) {
        console.error(e);
        alert(e.response?.data?.error || "Failed to delete staff member");
      }
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const currentData = filteredStaff.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Shield className="text-indigo-600" /> Staff & Team Management
        </h2>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search staff..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors text-sm font-medium"
          >
            <UserPlus size={16} /> Add Staff
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center py-10">
          Loading team members...
        </p>
      ) : (
        <div className="flex flex-col">
          <div className="overflow-auto h-[calc(100vh-280px)]">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gray-100 border-y border-gray-200">
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                    Name
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm">
                    Email
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-center">
                    Role
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-center">
                    Clients Assigned
                  </th>
                  <th className="bg-gray-100 py-3 px-4 font-semibold text-gray-600 text-sm text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((staff) => (
                  <tr
                    key={staff.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        {staff.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{staff.email}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${staff.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}
                      >
                        {staff.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-gray-800 font-bold">
                          {staff._count?.clients || 0}
                        </span>
                        {(staff._count?.clients || 0) > 0 && (
                          <a
                            href={`/clients?search=${encodeURIComponent(staff.name)}`}
                            className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors font-medium border border-indigo-200 cursor-pointer"
                          >
                            View Clients
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            handleResetPassword(staff.id, staff.name)
                          }
                          className="text-gray-400 hover:text-amber-600 transition-colors"
                          title="Reset Password to 0000"
                        >
                          <Key size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(staff)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(staff.id, staff.name)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      No staff members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredStaff.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(val) => {
              setItemsPerPage(val);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">
                {editingId ? "Edit Staff Member" : "Add New Staff Member"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="RM">Relationship Manager (RM)</option>
                  <option value="ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
                >
                  {editingId ? "Save Changes" : "Create Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
