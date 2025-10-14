
'use client';

import { AdminAuthWrapper } from '@/components/AdminAuthWrapper';
import { NavLink } from '@/components/common/NavLink';
import { Users, Package, BarChart3, FileCog, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';


function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const navLinks = [
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/tool-usage', label: 'Tool Usage', icon: BarChart3 },
  ];

  return (
    <div className="flex h-full max-h-screen flex-col gap-2 bg-muted/40">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/admin/users" className="flex items-center gap-2 font-semibold">
                <FileCog className="h-6 w-6 text-primary" />
                <span className="">DocuEase Admin</span>
            </Link>
        </div>
        <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-2">
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
        </div>
        <div className="mt-auto p-4">
             <Button variant="secondary" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
            </Button>
        </div>
    </div>
  );
}


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthWrapper>
      <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
          <AdminSidebar />
          <div className="flex flex-col">
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 overflow-auto">
                {children}
            </main>
          </div>
      </div>
    </AdminAuthWrapper>
  );
}
