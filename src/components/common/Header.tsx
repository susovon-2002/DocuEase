
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UserCircle, LogOut, LayoutDashboard, LogIn, Printer } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useUser, useAuth, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from 'react';
import { doc } from 'firebase/firestore';


const AuthContent = () => {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userProfileQuery = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  
  const { data: userProfile, isLoading: isUserProfileLoading } = useDoc(userProfileQuery);

  if (isUserLoading || isUserProfileLoading) {
    return <div className="h-11 w-24 rounded-md bg-muted" />;
  }
  
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="" alt={userProfile?.name || user.email || 'User'} />
              <AvatarFallback>
                <UserCircle />
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{userProfile?.name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={async () => {
              try {
                await signOut(auth);
                router.push('/');
              } catch (error) {
                console.error('Error signing out: ', error);
              }
            }}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button asChild size="lg">
      <Link href="/login">
        <LogIn className="mr-2 h-4 w-4" />
        Login
      </Link>
    </Button>
  );
};

const FluxLogo = () => (
    <div className="flex items-center space-x-2">
        <div className="grid grid-cols-4 gap-0.5">
            {Array.from({ length: 16 }).map((_, i) => (
                <div
                    key={i}
                    className="w-1 h-1 bg-primary rounded-full"
                    style={{ opacity: Math.random() * 0.8 + 0.2 }}
                />
            ))}
        </div>
        <span className="font-bold text-3xl font-headline tracking-wider">FLUX</span>
    </div>
);


const Header = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
             <FluxLogo />
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button asChild variant="ghost">
            <Link href="/">
              Home
            </Link>
          </Button>
          
          {isClient ? <AuthContent /> : <div className="h-11 w-24 rounded-md bg-muted" />}

        </div>
      </div>
    </header>
  );
};

export default Header;
