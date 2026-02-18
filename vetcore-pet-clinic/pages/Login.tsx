import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { PawPrint, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { AuthResponse } from '../types';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    try {
      // Backend expects application/x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append('username', data.username);
      formData.append('password', data.password);

      const response = await api.post<AuthResponse>('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const { access_token, role, name } = response.data;
      login(access_token, role, name);

      // Redirect based on role
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'doctor') navigate('/doctor/dashboard');
      else if (role === 'receptionist') navigate('/receptionist/dashboard');
      else navigate('/'); // Fallback
      
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setError("Invalid username or password");
      } else {
        setError("Server error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Side - Hero */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-teal-600 to-emerald-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <PawPrint className="w-8 h-8" />
            </div>
            <h1 className="font-heading text-3xl font-bold">VetCore</h1>
          </div>
          <h2 className="font-heading text-5xl font-bold leading-tight mb-6">
            Professional care for <br/> <span className="text-secondary">furry friends.</span>
          </h2>
          <p className="text-teal-100 text-lg max-w-md">
            Manage appointments, medical records, and inventory seamlessley with our modern clinic management system.
          </p>
        </div>

        <div className="z-10 text-sm text-teal-200">
          &copy; {new Date().getFullYear()} VetCore Clinic Management System
        </div>

        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-10 lg:text-left">
            <div className="lg:hidden flex justify-center mb-4">
               <div className="bg-teal-600 p-2 rounded-lg text-white">
                  <PawPrint className="w-8 h-8" />
               </div>
            </div>
            <h2 className="text-3xl font-heading font-bold text-slate-800 mb-2">Welcome Back</h2>
            <p className="text-slate-500">Please enter your credentials to access the dashboard.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm border border-red-100">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...register('username')}
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && <p className="text-xs text-danger mt-1">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  {...register('password')}
                  type="password"
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={loading}
            >
              Sign In
            </Button>
            
            <div className="text-center text-xs text-slate-400 mt-6">
               <p>Demo Credentials: admin / admin123</p>
               <p>doctor / doctor123 • reception / reception123</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};