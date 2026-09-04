import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRmIntelligence } from '../api/rm.api';
import { AlertTriangle, TrendingDown, PhoneCall, ShieldAlert, Target, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function RmActionDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getRmIntelligence()
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load RM Intelligence');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-gray-500 font-medium">Loading Intelligence...</div>;
  if (error) return <div className="p-8 text-red-500 font-medium">{error}</div>;
  if (!data) return null;

  const PIE_COLORS = ['#16a34a', '#84cc16', '#eab308', '#dc2626', '#9ca3af'];

  const atRiskAmount = data.quartiles.find((q: any) => q.name.includes('Q4'))?.value || 0;

  return (
    <div className="w-full max-w-[98%] mx-auto mt-8 pb-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
        <Target className="text-blue-600" size={32} /> RM Action Center
      </h2>
      <p className="text-gray-500 mb-8">Intelligent daily insights. Prioritize your calls and mitigate risk.</p>

      {/* Hero Opportunity Banner */}
      {atRiskAmount > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-5 rounded-r-xl mb-8 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Zap className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-red-800 font-extrabold text-lg">₹{(atRiskAmount / 100000).toFixed(1)} Lakhs at High Risk (Q4 Exposure)</h3>
              <p className="text-red-600 text-sm font-medium">This capital is currently sitting in bottom-quartile funds. Call these clients immediately to restructure.</p>
            </div>
          </div>
          <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-colors">
            Generate Q4 Call List
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Portfolio Quality Donut */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-1">Overall Portfolio Quality</h3>
          <p className="text-xs text-gray-500 mb-4">Total book broken down by research quartile.</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.quartiles.filter((q: any) => q.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {data.quartiles.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => ['₹' + (value / 100000).toFixed(1) + ' L', 'AUM']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Flight Risk Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
             <TrendingDown className="text-red-500" /> Flight Risk Tracker
          </h3>
          <p className="text-xs text-gray-500 mb-4">Bottom 5 clients with the largest 30-day negative growth.</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.flightRisk} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(val) => '-₹' + (Math.abs(val) / 100000).toFixed(0) + 'L'} reversed />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fontWeight: 'bold'}} />
                <RechartsTooltip formatter={(value: number) => ['-₹' + (Math.abs(value) / 100000).toFixed(1) + ' L', 'Loss']} />
                <Bar dataKey="growth" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Smart Call List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <PhoneCall className="text-blue-600" /> Smart Call List (Action Required)
        </h3>
        {data.callList.length === 0 ? (
          <p className="text-gray-500 italic">No urgent calls required today. Great job!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.callList.map((client: any, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3 hover:shadow-md transition-shadow bg-gray-50">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-gray-900">{client.name}</h4>
                  <Link 
                    to={`/clients/${client.clientId}`}
                    className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-1">
                  {client.isOverExposed && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded border border-amber-200 flex items-center gap-1">
                      <AlertTriangle size={12}/> Over-Exposed ({client.equityRatio.toFixed(0)}% Equity)
                    </span>
                  )}
                  {client.isOverdue && (
                    <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded border border-orange-200 flex items-center gap-1">
                      <TrendingDown size={12}/> Overdue for Review ({client.daysSinceReview} Days)
                    </span>
                  )}
                  {client.alerts > 0 && (
                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded border border-red-200 flex items-center gap-1">
                      <ShieldAlert size={12}/> {client.alerts} Pending Alerts
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
