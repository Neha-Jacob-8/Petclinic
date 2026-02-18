import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  title: string;
}

export const Topbar: React.FC<TopbarProps> = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white/50 backdrop-blur-md border-b border-white/50 flex items-center justify-between px-8 sticky top-0 z-10">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-800">{title}</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-full px-4 py-2 w-64 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
          <Search className="w-4 h-4 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-500 hover:text-primary transition-colors rounded-full hover:bg-teal-50">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border border-white"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-700">Hello, {user?.name} 👋</p>
                <p className="text-xs text-slate-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
             </div>
          </div>
        </div>
      </div>
    </header>
  );
};