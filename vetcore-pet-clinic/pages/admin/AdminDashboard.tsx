import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { Calendar, DollarSign, Package, Users, TrendingUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { api } from '../../api/axios';
import { DashboardStats, RevenueData, ServiceUsage, AppointmentStats } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [services, setServices] = useState<ServiceUsage[]>([]);
  const [apptStats, setApptStats] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const startStr = thirtyDaysAgo.toISOString().split('T')[0];
        const endStr = today.toISOString().split('T')[0];

        const [statsRes, revenueRes, servicesRes, apptsRes] = await Promise.all([
          api.get('/reports/dashboard'),
          api.get(`/reports/revenue?start=${startStr}&end=${endStr}`),
          api.get(`/reports/services?start=${startStr}&end=${endStr}`),
          api.get(`/reports/appointments?start=${startStr}&end=${endStr}`),
        ]);

        setStats(statsRes.data);
        setRevenue(revenueRes.data.data || []);
        setServices(servicesRes.data || []);

        const a = apptsRes.data as AppointmentStats;
        setApptStats([
          { name: 'Completed', value: a.completed, color: '#10B981' },
          { name: 'Scheduled', value: a.scheduled, color: '#3B82F6' },
          { name: 'Cancelled', value: a.cancelled, color: '#EF4444' },
        ]);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card className="hover:scale-105 transition-transform duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-heading font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="text-white w-6 h-6" />
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Appointments"
          value={stats?.todays_appointments ?? 0}
          icon={Calendar}
          color="bg-teal-500"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${stats?.total_revenue_today?.toLocaleString() ?? '0'}`}
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatCard
          title="Low Stock Items"
          value={stats?.low_stock_count ?? 0}
          icon={Package}
          color="bg-amber-500"
        />
        <StatCard
          title="Active Staff"
          value={stats?.active_staff ?? 0}
          icon={Users}
          color="bg-blue-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <Card className="h-96">
            <h3 className="text-lg font-heading font-semibold text-slate-800 mb-6">Revenue Overview (Last 30 Days)</h3>
            {revenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={revenue}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#0D9488" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">No revenue data yet</div>
            )}
          </Card>
        </div>

        {/* Appointment Distribution */}
        <div>
          <Card className="h-96">
            <h3 className="text-lg font-heading font-semibold text-slate-800 mb-6">Appointments Status</h3>
            {apptStats.some(s => s.value > 0) ? (
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={apptStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {apptStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-slate-400">No appointment data yet</div>
            )}
          </Card>
        </div>
      </div>

      {/* Services Usage */}
      <Card>
        <h3 className="text-lg font-heading font-semibold text-slate-800 mb-6">Top Performing Services</h3>
        <div className="h-64">
          {services.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={services} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" hide />
                <YAxis dataKey="service_name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fill: '#475569', fontSize: 14, fontWeight: 500 }} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">No service usage data yet</div>
          )}
        </div>
      </Card>
    </div>
  );
};