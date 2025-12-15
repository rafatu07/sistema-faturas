'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Receipt, BarChart3, LogOut } from 'lucide-react';
import { logout } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/empenhos', label: 'Empenhos', icon: FileText },
  { href: '/faturas', label: 'Faturas', icon: Receipt },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { userData } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Sistema de Faturas</h1>
        {userData && (
          <p className="text-sm text-gray-400 mt-1">
            {userData.name} ({userData.role === 'admin' ? 'Admin' : 'Usuário'})
          </p>
        )}
      </div>
      
      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <Button
        variant="ghost"
        onClick={handleLogout}
        className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
      >
        <LogOut className="w-5 h-5 mr-3" />
        Sair
      </Button>
    </div>
  );
}

