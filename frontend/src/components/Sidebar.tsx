import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  PieChart,
  GitMerge,
  LogOut,
  Menu,
  ChevronLeft,
  UploadCloud,
  Shield,
  TrendingUp,
  Bell,
  UserRoundCog,
  User,
} from "lucide-react";

interface SidebarProps {
  user: any;
  onLogout: () => void;
  rmCanViewClients: boolean;
}

export default function Sidebar({
  user,
  onLogout,
  rmCanViewClients,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const NavItem = ({
    to,
    icon,
    label,
    adminOnly,
  }: {
    to: string;
    icon: React.ReactNode;
    label: string;
    adminOnly?: boolean;
  }) => {
    if (adminOnly && user?.role !== "ADMIN") return null;
    const isActive = location.pathname === to;

    return (
      <Link
        to={to}
        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors mb-1 ${
          isActive
            ? "bg-blue-600 text-white shadow-md"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`}
        title={!isOpen ? label : undefined}
      >
        <div className="flex-shrink-0">{icon}</div>
        {isOpen && (
          <span className="font-medium whitespace-nowrap">{label}</span>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`bg-gray-900 text-white flex flex-col transition-all duration-300 min-h-screen border-r border-gray-800 ${isOpen ? "w-64" : "w-20"}`}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800 h-16">
        {isOpen && (
          <h1 className="font-bold text-xl tracking-wider text-blue-400">
            PLENITUDE
          </h1>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
        >
          {isOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* User Info */}
      <div
        className={`p-4 border-b border-gray-800 flex items-center gap-3 ${!isOpen && "justify-center"}`}
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
          {user?.name.charAt(0)}
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.role}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        <nav className="px-3 space-y-1">
          <NavItem
            to="/"
            icon={<LayoutDashboard size={20} />}
            label="Dashboard"
          />
          <NavItem to="/alerts" icon={<Bell size={20} />} label="Alerts" />
          <NavItem
            to="/upload"
            icon={<UploadCloud size={20} />}
            label="Upload Data"
            adminOnly
          />

          {(user?.role === "ADMIN" || rmCanViewClients) && (
            <NavItem to="/clients" icon={<Users size={20} />} label="Clients" />
          )}

          <NavItem
            to="/research"
            icon={<PieChart size={20} />}
            label="Research"
          />
          <NavItem
            to="/mapping"
            icon={<GitMerge size={20} />}
            label="Mapping"
            adminOnly
          />
          <NavItem
            to="/strategy"
            icon={<TrendingUp size={20} />}
            label="Strategy"
            adminOnly
          />
          <NavItem
            to="/staff"
            icon={<UserRoundCog size={20} />}
            label="Staff"
            adminOnly
          />
          <NavItem
            to="/access-control"
            icon={<Shield size={20} />}
            label="Access Control"
            adminOnly
          />
          <NavItem
            to="/profile"
            icon={<User size={20} />}
            label="My Profile"
          />
        </nav>
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={onLogout}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full ${!isOpen && "justify-center"}`}
          title={!isOpen ? "Logout" : undefined}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {isOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
