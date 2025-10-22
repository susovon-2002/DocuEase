
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
    return <div className="h-10 w-10 rounded-full bg-muted" />;
  }
  
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
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
    <Button asChild>
      <Link href="/login">Login</Link>
    </Button>
  );
};

const DocuEaseLogo = () => (
    <div className="flex items-center space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        <span className="font-bold text-xl">DocuEase</span>
    </div>
);


const Header = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center">
        <div className="mr-auto flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
             <DocuEaseLogo />
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-2 text-sm">
           <Button asChild variant="ghost">
            <Link href="/">Home</Link>
          </Button>
           <Button asChild variant="ghost">
            <Link href="/#all-tools">Tools</Link>
          </Button>
           <Button asChild variant="ghost">
            <Link href="/pricing">Pricing</Link>
          </Button>
        </nav>
        
        <div className="flex flex-1 items-center justify-end space-x-4">
          {isClient && <AuthContent />}
          <Button asChild variant="outline">
            <Link href="/dashboard">My Account</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
