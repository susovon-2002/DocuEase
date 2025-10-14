'use client';

import { AdminAuthWrapper } from '@/components/AdminAuthWrapper';
import { NavLink } from '@/components/common/NavLink';
import { Users, Package, BarChart3 } from 'lucide-react';
import { usePathname } from 'next/navigation';

function AdminSidebar() {
  const pathname = usePathname();
  const navLinks = [
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/tool-usage', label: 'Tool Usage', icon: BarChart3 },
  ];

  return (
    <nav className="flex flex-col gap-2 bg-muted/50 p-4 rounded-lg">
      {navLinks.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          href={href}
          isActive={pathname.startsWith(href)}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          activeClassName="bg-primary text-primary-foreground hover:text-primary-foreground"
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthWrapper>
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr] gap-6">
          <AdminSidebar />
          <main>{children}</main>
        </div>
      </div>
    </AdminAuthWrapper>
  );
}
