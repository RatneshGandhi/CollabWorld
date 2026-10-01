import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/ui/Navbar';
import { FileText, ShieldCheck, CheckCircle2, User, Mail, Calendar } from 'lucide-react';

export const DashboardPreview = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Banner */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-xl uppercase">
                {user?.name?.charAt(0) || <User className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">
                    Welcome, {user?.name || 'Explorer'}!
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> Authenticated
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  Your session is verified and encrypted via PostgreSQL & JWT
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Checkpoints Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Details */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Active User Profile
            </h2>
            <dl className="divide-y divide-slate-100 text-sm">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500 font-medium">User ID</dt>
                <dd className="font-mono text-slate-800">{user?.id}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500 font-medium">Full Name</dt>
                <dd className="text-slate-800 font-semibold">{user?.name}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500 font-medium">Email</dt>
                <dd className="text-slate-800">{user?.email}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500 font-medium">Role</dt>
                <dd className="uppercase text-xs font-bold text-blue-600 tracking-wider">
                  {user?.role || 'user'}
                </dd>
              </div>
            </dl>
          </div>

          {/* System Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Day 8 Architecture Checklist
            </h2>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Tailwind CSS v4 & Google Docs Theme active</span>
              </li>
              <li className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Axios interceptor injecting Bearer JWT token</span>
              </li>
              <li className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Global AuthContext reactive state hydrated</span>
              </li>
              <li className="flex items-center gap-2.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Protected Route guard protecting private views</span>
              </li>
            </ul>

            <div className="mt-6 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
              💡 <strong>Ready for Day 9:</strong> Document grid, template creation, and search filtering will mount right here.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};