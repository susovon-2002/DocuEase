
'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, User, ShieldCheck, ShieldOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading, error } = useCollection(usersQuery);

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
      <div className="text-center text-destructive">
        <p>Error loading users: {error.message}</p>
        <p className="text-sm mt-2">Please wait a moment and refresh the page. If the issue persists, check your Firestore rules.</p>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View and manage all registered users on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {users && users.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Registration Date</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead className="text-right">Restricted</TableHead>
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
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end space-x-2">
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users have registered yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
