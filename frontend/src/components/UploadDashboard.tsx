import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Database, Users, BarChart2, FolderDown, Activity } from 'lucide-react';
import { uploadFile, uploadBulkPortfolios } from '../api/upload.api';
import axiosClient from '../api/axiosClient';

export default function UploadDashboard() {
  const [fileClient, setFileClient] = useState<File | null>(null);
  const [fileResearch, setFileResearch] = useState<File | null>(null);
  const [fileHoldings, setFileHoldings] = useState<File | null>(null);
  const [bulkFiles, setBulkFiles] = useState<FileList | null>(null);
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  
  const [stats, setStats] = useState({ clientsCount: 0, rmsCount: 0, fundsCount: 0, holdingsCount: 0 });

  const fetchStats = async () => {
    try {
      const response = await axiosClient.get('/data/stats');
      setStats(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleBulkUpload = async () => {
    if (!bulkFiles || bulkFiles.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < bulkFiles.length; i++) {
      formData.append('files', bulkFiles[i]);
    }
    try {
      setLoading(true);
      setStatus({ type: 'idle', message: 'Uploading and processing bulk portfolios...' });
      const response = await axiosClient.post('/upload/portfolios/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBulkResults(response.data.results);
      setStatus({ type: 'success', message: 'Bulk processing complete! Review the results below.' });
      fetchStats();
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', message: 'Failed to upload bulk portfolios.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (endpoint: string) => {
    let file = null;
    if (endpoint === 'clients') file = fileClient;
    if (endpoint === 'research') file = fileResearch;
    if (endpoint === 'holdings') file = fileHoldings;
    
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus({ type: 'idle', message: 'Uploading and parsing into DB...' });
      const response = await axiosClient.post(`/upload/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus({ type: 'success', message: `Inserted ${response.data.rowsInserted || 'records'} into DB successfully!` });
      fetchStats();
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', message: `Failed to upload ${file.name}.` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-10 p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Client Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Users size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">1. Client Sheet</h2>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Upload the master list of clients including PAN, RM mappings, and summary AUMs.
          </p>
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${fileClient ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
              <UploadCloud className={`w-8 h-8 mb-2 ${fileClient ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className="text-sm text-gray-600 font-medium truncate max-w-[200px]">
                {fileClient ? fileClient.name : "Click to select Excel file"}
              </p>
            </div>
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => setFileClient(e.target.files?.[0] || null)} />
          </label>
          <button 
            onClick={() => handleUpload('clients')}
            disabled={!fileClient || loading}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? 'Uploading...' : 'Upload Clients'}
          </button>
        </div>

        {/* Research Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <Database size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">2. Research Sheet</h2>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Upload Plenitude's proprietary mutual fund research, rankings, and quartiles.
          </p>
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${fileResearch ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
              <UploadCloud className={`w-8 h-8 mb-2 ${fileResearch ? 'text-purple-500' : 'text-gray-400'}`} />
              <p className="text-sm text-gray-600 font-medium truncate max-w-[200px]">
                {fileResearch ? fileResearch.name : "Click to select Excel file"}
              </p>
            </div>
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => setFileResearch(e.target.files?.[0] || null)} />
          </label>
          <button 
            onClick={() => handleUpload('research')}
            disabled={!fileResearch || loading}
            className="mt-4 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? 'Uploading...' : 'Upload Research'}
          </button>
        </div>

        {/* Holdings Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <BarChart2 size={24} />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">3. AUM Foliowise</h2>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Upload exact client portfolios and folios to power accurate Q3/Q4 Alerts.
          </p>
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${fileHoldings ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
              <UploadCloud className={`w-8 h-8 mb-2 ${fileHoldings ? 'text-emerald-500' : 'text-gray-400'}`} />
              <p className="text-sm text-gray-600 font-medium truncate max-w-[200px]">
                {fileHoldings ? fileHoldings.name : "Click to select Excel file"}
              </p>
            </div>
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => setFileHoldings(e.target.files?.[0] || null)} />
          </label>
          <button 
            onClick={() => handleUpload('holdings')}
            disabled={!fileHoldings || loading}
            className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? 'Uploading...' : 'Upload Portfolios'}
          </button>
        </div>
      </div>

      {status.type !== 'idle' && (
        <div className={`mt-8 p-4 rounded-md flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{status.message}</span>
        </div>
      )}

      {/* Bulk Portfolio Dropzone */}
      <div className="bg-white rounded-xl shadow-sm border border-indigo-200 p-8 mt-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <FolderDown size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
              <FolderDown size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Bulk Portfolio Sync</h2>
              <p className="text-gray-500 text-sm mt-1">Drag and drop an entire folder of Portfolio Valuation Reports (Investwell/NJ Wealth format).</p>
            </div>
          </div>
          
          <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${bulkFiles && bulkFiles.length > 0 ? 'border-indigo-500 bg-indigo-50' : 'border-indigo-300 bg-indigo-50/30 hover:bg-indigo-50'}`}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
              <FolderDown className={`w-10 h-10 mb-3 ${bulkFiles && bulkFiles.length > 0 ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <p className="text-base font-semibold text-gray-700 mb-1">
                {bulkFiles && bulkFiles.length > 0 ? bulkFiles.length + ' files selected' : "Drag & Drop your export folder here"}
              </p>
              <p className="text-sm text-gray-500">
                Or click to browse multiple files (.xlsx)
              </p>
            </div>
            <input type="file" className="hidden" accept=".xlsx,.xls,.csv" multiple onChange={(e) => setBulkFiles(e.target.files)} />
          </label>
          
          <button 
            onClick={handleBulkUpload}
            disabled={!bulkFiles || bulkFiles.length === 0 || loading}
            className="mt-6 w-full md:w-auto px-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Activity className="animate-spin" size={20} /> : <FolderDown size={20} />}
            {loading ? 'Processing Files...' : 'Run Bulk Sync'}
          </button>
        </div>
      </div>

      {/* Bulk Results Table */}
      {bulkResults.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Database size={18} className="text-indigo-600" /> Bulk Processing Log
            </h3>
            <span className="text-sm font-medium px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-600">
              {bulkResults.length} files processed
            </span>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-white sticky top-0 shadow-sm">
                <tr>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Client Name</th>
                  <th className="px-6 py-3 font-medium">Holdings Found</th>
                  <th className="px-6 py-3 font-medium">File Name</th>
                  <th className="px-6 py-3 font-medium">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bulkResults.map((res, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      {res.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle size={14} /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <AlertCircle size={14} /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">{res.clientName}</td>
                    <td className="px-6 py-3 text-gray-600">{res.holdingsInserted}</td>
                    <td className="px-6 py-3 text-gray-500 truncate max-w-[200px]" title={res.filename}>{res.filename}</td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{res.error || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Database Stats */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="text-gray-500" /> Database Live Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{stats.clientsCount}</p>
            <p className="text-sm text-blue-600">Clients</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-indigo-700">{stats.rmsCount}</p>
            <p className="text-sm text-indigo-600">Relationship Managers</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-purple-700">{stats.fundsCount}</p>
            <p className="text-sm text-purple-600">Research Funds</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-lg">
            <p className="text-2xl font-bold text-emerald-700">{stats.holdingsCount}</p>
            <p className="text-sm text-emerald-600">Client Holdings</p>
          </div>
        </div>
      </div>
    </div>
  );
}
