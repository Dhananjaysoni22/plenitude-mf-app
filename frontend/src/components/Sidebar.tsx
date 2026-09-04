import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, PieChart, GitMerge, LogOut, Menu, ChevronLeft, UploadCloud, Shield, TrendingUp, Bell } from 'lucide-react';

interface SidebarProps {
  user: any;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const NavItem = ({ to, icon, label, adminOnly }: { to: string; icon: React.ReactNode; label: string; adminOnly?: boolean }) => {
    if (adminOnly && user?.role !== 'ADMIN') return null;
    const isActive = location.pathname === to;

    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors mb-1 ${
          isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
        title={!isOpen ? label : undefined}
      >
        <div className="flex-shrink-0">{icon}</div>
        {isOpen && <span className="font-medium whitespace-nowrap">{label}</span>}
      </Link>
    );
  };

  return (
    <div className={`flex flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-20'} min-h-screen border-r border-gray-800`}>
      
      {/* Header Logo & Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {isOpen && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg shadow-blue-600/20">
              P
            </div>
            <h1 className="text-lg font-bold text-white truncate">Plenitude</h1>
          </div>
        )}
        {!isOpen && (
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-xl mx-auto shadow-lg shadow-blue-600/20">
            P
          </div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className={`p-1.5 rounded-md text-gray-400 hover:bg-gray-800 hover:text-white transition-colors ${!isOpen ? 'hidden' : ''}`}
        >
          <ChevronLeft size={20} />
        </button>
      </div>
      
      {!isOpen && (
        <div className="flex justify-center mt-4">
           <button onClick={() => setIsOpen(true)} className="p-2 rounded-md text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* User Info */}
      <div className={`px-4 py-4 border-b border-gray-800 flex flex-col ${isOpen ? 'items-start' : 'items-center'}`}>
        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-blue-400 font-bold mb-2">
          {user?.name.charAt(0)}
        </div>
        {isOpen && (
          <div className="overflow-hidden w-full">
            <p className="text-sm font-semibold truncate text-gray-200">{user?.name}</p>
            <p className="text-xs text-blue-400 font-medium tracking-wider uppercase mt-0.5">{user?.role}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto overflow-x-hidden">
        <NavItem to="/" icon={<LayoutDashboard size={20} />} label={user?.role === 'ADMIN' ? 'Dashboard' : 'Action Center'} />
        <NavItem to="/alerts" icon={<Bell size={20} />} label="Alerts" />
        <NavItem to="/upload" icon={<UploadCloud size={20} />} label="Upload Data" adminOnly />
        <NavItem to="/clients" icon={<Users size={20} />} label="Clients" />
        <NavItem to="/research" icon={<PieChart size={20} />} label="Research" />
        <NavItem to="/mapping" icon={<GitMerge size={20} />} label="Mapping" adminOnly />
        <NavItem to="/staff" icon={<Shield size={20} />} label="Staff" adminOnly />
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={onLogout} 
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full ${isOpen ? 'justify-start' : 'justify-center'}`}
          title={!isOpen ? 'Logout' : undefined}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {isOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}
