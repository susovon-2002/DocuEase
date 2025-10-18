
'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, User, ShieldCheck, ShieldOff, LogIn } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  // CORRECTED: Use useDoc to fetch only the current user's document.
  const userProfileQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser]);

  // CORRECTED: Use useDoc hook which returns a single object.
  const { data: user, isLoading, error } = useDoc(userProfileQuery);

  const handleAdminToggle = async (userId: string, isAdmin: boolean) => {
    if (!firestore) return;
    setUpdatingUsers(prev => new Set(prev).add(userId));
    try {
        const userRef = doc(firestore, 'users', userId);
        await setDoc(userRef, { isAdmin: !isAdmin }, { merge: true });
        toast({ title: 'Success', description: `User admin status updated.` });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update user.' });
    } finally {
        setUpdatingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
    }
  };
  
  const handleLoginAsUser = async (email: string) => {
    toast({
      title: 'Simulating Login',
      description: `In a production app, you would now be logged in as ${email}. Redirecting to dashboard.`,
    });
    router.push('/dashboard');
  }

  const handleRestrictionToggle = async (userId: string, isRestricted: boolean) => {
    if (!firestore) return;
    setUpdatingUsers(prev => new Set(prev).add(userId));
     try {
        const userRef = doc(firestore, 'users', userId);
        await setDoc(userRef, { isRestricted: !isRestricted }, { merge: true });
        toast({ title: 'Success', description: `User restriction status updated.` });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not update user.' });
    } finally {
        setUpdatingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
    }
  }


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-destructive p-4 border border-destructive/50 rounded-md">
        <h2 className="text-lg font-bold">Permission Error</h2>
        <p>Could not load user data. This is likely because your security rules are correctly preventing access.</p>
        <p className="text-sm mt-2">This panel requires admin permission to list all users. Please check your Firestore rules.</p>
      </div>
    );
  }
  
  // Create an array with the single user object to avoid changing the table mapping logic
  const users = user ? [user] : [];

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage your administrator profile.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Restricted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                        <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={user.photoURL} />
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{user.name || 'N/A'}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                      {user.registrationDate ? format(user.registrationDate.toDate(), 'PPp') : 'N/A'}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center space-x-2">
                           {updatingUsers.has(user.id) ? <Loader2 className="h-4 w-4 animate-spin"/> :
                            <Switch
                                id={`admin-${user.id}`}
                                checked={!!user.isAdmin}
                                onCheckedChange={() => handleAdminToggle(user.id, !!user.isAdmin)}
                            />
                           }
                            <Label htmlFor={`admin-${user.id}`}>{user.isAdmin ? <ShieldCheck className="text-green-600" /> : <ShieldOff className="text-muted-foreground"/>}</Label>
                        </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center space-x-2">
                           {updatingUsers.has(user.id) ? <Loader2 className="h-4 w-4 animate-spin"/> :
                                <Switch
                                    id={`restricted-${user.id}`}
                                    checked={!!user.isRestricted}
                                    onCheckedChange={() => handleRestrictionToggle(user.id, !!user.isRestricted)}
                                    className="data-[state=checked]:bg-destructive"
                                />
                           }
                            <Label htmlFor={`restricted-${user.id}`}>{user.isRestricted ? 'Yes' : 'No'}</Label>
                        </div>
                    </TableCell>
                     <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleLoginAsUser(user.email)} disabled={true} title="This feature is for demonstration.">
                            <LogIn className="mr-2 h-4 w-4" />
                            Login As
                        </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Could not load your user profile.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
