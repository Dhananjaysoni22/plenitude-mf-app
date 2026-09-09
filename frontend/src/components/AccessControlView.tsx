import React, { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings } from '../api/data.api';
import { Shield, ToggleLeft, ToggleRight, CheckCircle } from 'lucide-react';

export default function AccessControlView() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchSettings = async () => {
    try {
      const { data } = await getSystemSettings();
      setSettings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const toggleRmCanViewClients = async () => {
    try {
      setSaving(true);
      const { data } = await updateSystemSettings({
        rmCanViewClients: !settings.rmCanViewClients
      });
      setSettings(data);
      setSuccessMsg("Settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Shield className="text-indigo-600" size={32} /> Access Control Center
        </h1>
        <p className="text-gray-600 mt-2">Firm-wide Feature Flags & RBAC Management</p>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2 font-medium">
          <CheckCircle size={20} /> {successMsg}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-bold text-gray-800">Role: Relationship Manager (RM)</h2>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Master Clients List Tab</h3>
              <p className="text-gray-500 text-sm mt-1">If disabled, RMs cannot access the full alphabetical 'Clients' tab. They will only be able to view profiles they click on from their Action Dashboard.</p>
            </div>
            
            <button 
              onClick={toggleRmCanViewClients}
              disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${settings?.rmCanViewClients ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
            >
              {settings?.rmCanViewClients ? (
                <><ToggleRight size={24} /> Enabled</>
              ) : (
                <><ToggleLeft size={24} /> Disabled</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
