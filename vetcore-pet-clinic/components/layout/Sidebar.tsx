import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  Package, 
  FileBarChart, 
  Bell, 
  Receipt, 
  Calendar, 
  ClipboardList, 
  PawPrint,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const role = user?.role;

  const getLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/admin/staff', icon: Users, label: 'Staff' },
          { to: '/admin/services', icon: Stethoscope, label: 'Services' },
          { to: '/admin/inventory', icon: Package, label: 'Inventory' },
          { to: '/admin/reports', icon: FileBarChart, label: 'Reports' },
          { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
          { to: '/admin/billing', icon: Receipt, label: 'Billing' },
        ];
      case 'doctor':
        return [
          { to: '/doctor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
          { to: '/doctor/records', icon: ClipboardList, label: 'Medical Records' },
          { to: '/doctor/history', icon: PawPrint, label: 'Pet History' },
        ];
      case 'receptionist':
        return [
          { to: '/receptionist/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/receptionist/owners', icon: Users, label: 'Owners & Pets' },
          { to: '/receptionist/appointments', icon: Calendar, label: 'Appointments' },
          { to: '/receptionist/billing', icon: Receipt, label: 'Billing' },
          { to: '/receptionist/payments', icon: CreditCard, label: 'Payments' },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside 
      className={`bg-sidebar text-slate-300 h-screen transition-all duration-300 flex flex-col fixed left-0 top-0 z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="h-20 flex items-center justify-center border-b border-slate-800">
        <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
                <PawPrint className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
                <span className="font-heading font-bold text-xl text-white tracking-tight">VetCore</span>
            )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <link.icon className={`w-5 h-5 ${collapsed ? 'w-6 h-6' : ''}`} />
            {!collapsed && <span className="font-medium text-sm">{link.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 bg-slate-700 text-white p-1 rounded-full shadow-lg border border-slate-600 hover:bg-primary transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
           <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
             {user?.name.charAt(0)}
           </div>
           {!collapsed && (
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium text-white truncate">{user?.name}</p>
               <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
             </div>
           )}
           {!collapsed && (
             <button onClick={logout} className="text-slate-500 hover:text-danger transition-colors">
               <LogOut size={18} />
             </button>
           )}
        </div>
      </div>
    </aside>
  );
};
