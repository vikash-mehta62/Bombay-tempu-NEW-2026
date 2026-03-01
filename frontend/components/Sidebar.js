'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Users,
  UserCircle,
  MapPin,
  Receipt,
  FileText,
  CreditCard,
  BarChart3,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Vehicles',
    href: '/dashboard/vehicles',
    icon: Truck,
  },
  {
    title: 'Drivers',
    href: '/dashboard/drivers',
    icon: UserCircle,
  },
  {
    title: 'Fleet Owners',
    href: '/dashboard/fleet-owners',
    icon: Building2,
  },
  {
    title: 'Clients',
    href: '/dashboard/clients',
    icon: Users,
  },
  {
    title: 'Trips',
    href: '/dashboard/trips',
    icon: MapPin,
  },
  {
    title: 'Expenses',
    href: '/dashboard/expenses',
    icon: Receipt,
  },
  {
    title: 'Invoices',
    href: '/dashboard/invoices',
    icon: FileText,
  },
  {
    title: 'Payments',
    href: '/dashboard/payments',
    icon: CreditCard,
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
  },
  {
    title: 'Activity Logs',
    href: '/dashboard/logs',
    icon: Activity,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    // Close mobile menu when link is clicked
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          'bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
          // Desktop styles
          'lg:sticky lg:top-0 lg:h-screen',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile styles
          'fixed top-0 left-0 h-screen w-64 z-50 lg:z-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'shadow-xl lg:shadow-none'
        )}
      >
        {/* Header */}
        <div className={cn(
          'p-4 lg:p-6 border-b border-gray-200 flex items-center justify-between',
          isCollapsed && 'lg:px-3'
        )}>
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">TMS</h1>
                <p className="text-xs text-gray-500 truncate">Fleet Manager</p>
              </div>
            )}
          </div>
          
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50',
                  isCollapsed ? 'lg:justify-center' : 'space-x-3'
                )}
                title={isCollapsed ? item.title : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={cn(isCollapsed && 'lg:hidden')}>{item.title}</span>
                
                {/* Tooltip for collapsed state - Desktop only */}
                {isCollapsed && (
                  <div className="hidden lg:block absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.title}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle Button - Desktop Only */}
        <div className="hidden lg:block flex-shrink-0 p-3 bg-white border-t border-gray-200">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200",
              "bg-gray-50 hover:bg-gray-100 border border-gray-200",
              "text-gray-700 hover:text-gray-900",
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <span className="text-sm font-medium">Collapse</span>
                <ChevronLeft className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
