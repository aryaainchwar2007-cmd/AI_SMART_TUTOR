import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Database,
  Sparkles,
  BarChart3,
  Calculator,
  BrainCircuit,
  Bot,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronRight,
  ShieldCheck,
  Code2,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Python Code Lab', path: '/learning', icon: Code2 },
  { name: 'Datasets', path: '/datasets', icon: Database },
  { name: 'Data Cleaning', path: '/cleaning', icon: Sparkles },
  { name: 'Visualization Lab', path: '/visualization', icon: BarChart3 },
  { name: 'Statistical Analysis', path: '/statistics', icon: Calculator },
  { name: 'ML Lab', path: '/ml-lab', icon: BrainCircuit },
  { name: 'AI Smart Tutor', path: '/tutor', icon: Bot },
  { name: 'Academic Reports', path: '/reports', icon: FileText },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const workflowSteps = [
  { name: 'Learn Python', path: '/learning' },
  { name: 'Upload & Inspect', path: '/datasets' },
  { name: 'Clean Data', path: '/cleaning' },
  { name: 'Visualize', path: '/visualization' },
  { name: 'Statistics', path: '/statistics' },
  { name: 'Train Models', path: '/ml-lab' },
  { name: 'Ask AI Tutor', path: '/tutor' },
  { name: 'Generate Report', path: '/reports' },
];

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 antialiased overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-slate-900 text-slate-200 border-r border-slate-800 shadow-xl z-20">
        <div className="p-5 flex items-center space-x-3 border-b border-slate-800">
          <div className="p-2 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white">AI Smart Tutor</h1>
            <p className="text-xs text-slate-400">Data Science Lab</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={`flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate mr-2">
              <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
              <div className="flex items-center mt-0.5 space-x-1">
                <ShieldCheck className="h-3 w-3 text-emerald-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  {user?.role || 'student'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="text-xs md:text-sm font-medium text-slate-500 hidden sm:inline-block">
              University B.Tech Laboratory
            </span>
          </div>

          {/* Guided Workflow Steps Banner */}
          <div className="hidden lg:flex items-center space-x-1 text-xs text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200">
            {workflowSteps.map((step, idx) => (
              <React.Fragment key={step.name}>
                <span
                  onClick={() => navigate(step.path)}
                  className={`cursor-pointer transition hover:text-blue-600 ${
                    location.pathname.startsWith(step.path) ? 'font-bold text-blue-600' : ''
                  }`}
                >
                  {step.name}
                </span>
                {idx < workflowSteps.length - 1 && (
                  <ChevronRight className="h-3 w-3 text-slate-400 inline mx-0.5" />
                )}
              </React.Fragment>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              v1.0.0
            </span>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 text-white p-4 space-y-2 border-b border-slate-800 shadow-xl">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-3 py-2 rounded text-sm text-slate-300 hover:bg-slate-800"
              >
                <item.icon className="h-4 w-4 mr-3" />
                {item.name}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-left flex items-center px-3 py-2 text-sm text-red-400 hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        )}

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
