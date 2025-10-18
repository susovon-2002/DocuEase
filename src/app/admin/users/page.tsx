
'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, collection, query, where, Timestamp } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow } from 'date-fns';
import { Loader2, User, FileStack, Wrench, Package, Activity, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { signOut, getAuth } from 'firebase/auth';


export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const userProfileQuery = useMemoFirebase(() => {
    if (!firestore || !currentUser) return null;
    return doc(firestore, 'users', currentUser.uid);
  }, [firestore, currentUser]);

  const { data: user, isLoading: isProfileLoading, error: userError } = useDoc(userProfileQuery);

  const documentsQuery = useMemoFirebase(() => {
    if (!currentUser || !firestore) return null;
    return query(collection(firestore, `users/${currentUser.uid}/documents`));
  }, [firestore, currentUser]);
  const { data: documents, isLoading: documentsLoading } = useCollection(documentsQuery);

  const toolUsagesQuery = useMemoFirebase(() => {
    if (!currentUser || !firestore) return null;
    return query(collection(firestore, `users/${currentUser.uid}/toolUsages`));
  }, [firestore, currentUser]);
  const { data: toolUsages, isLoading: toolUsagesLoading } = useCollection(toolUsagesQuery);

  const ordersQuery = useMemoFirebase(() => {
    if (!currentUser || !firestore) return null;
    return query(collection(firestore, 'orders'), where('userId', '==', currentUser.uid));
  }, [firestore, currentUser]);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);

   const recentActivities = useMemo(() => {
    if (!toolUsages) return [];
    return [...toolUsages]
      .sort((a, b) => {
        const dateA = a.usageTimestamp instanceof Timestamp ? a.usageTimestamp.toDate() : new Date(a.usageTimestamp);
        const dateB = b.usageTimestamp instanceof Timestamp ? b.usageTimestamp.toDate() : new Date(b.usageTimestamp);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [toolUsages]);
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'pending':
      case 'processing':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const isLoading = isUserLoading || isProfileLoading || documentsLoading || toolUsagesLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="text-center text-destructive p-4 border border-destructive/50 rounded-md">
        <h2 className="text-lg font-bold">Permission Error</h2>
        <p>Could not load your user data.</p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>Your administrator account details.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user?.photoURL} />
                    <AvatarFallback><User size={48} /></AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-xl">{user?.name || 'Admin'}</h3>
                <p className="text-muted-foreground text-sm">{user?.email}</p>
            </CardContent>
            <CardFooter>
                 <Button onClick={() => signOut(getAuth())} variant="outline" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" /> Log Out
                </Button>
            </CardFooter>
        </Card>
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Documents Processed</CardTitle>
                    <FileStack className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{documents?.length || 0}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tools Used</CardTitle>
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{toolUsages?.length || 0}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Your Orders</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-2xl font-bold">{orders?.length || 0}</p>
                </CardContent>
            </Card>
        </div>
        <Card className="lg:col-span-3">
          <CardHeader>
              <CardTitle>Your Recent Orders</CardTitle>
              <CardDescription>A summary of your latest print & delivery orders.</CardDescription>
          </CardHeader>
          <CardContent>
             {orders && orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.slice(0,5).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium truncate max-w-[100px]">{order.id}</TableCell>
                          <TableCell>{order.orderDate ? format(order.orderDate.toDate(), 'PP') : 'N/A'}</TableCell>
                          <TableCell>{order.orderType}</TableCell>
                          <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                             <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    You have not placed any orders.
                  </div>
                )}
          </CardContent>
        </Card>
         <Card className="lg:col-span-3">
              <CardHeader>
                  <CardTitle>Your Recent Activity</CardTitle>
                  <CardDescription>Your latest tool usage.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {recentActivities && recentActivities.length > 0 ? recentActivities.map(activity => (
                      <div key={activity.id} className="flex items-center">
                          <Activity className="h-4 w-4 mr-4 text-muted-foreground" />
                          <div className="flex-grow">
                              <p className="text-sm font-medium">{activity.toolName}</p>
                              <p className="text-xs text-muted-foreground">{activity.usageTimestamp ? formatDistanceToNow(activity.usageTimestamp.toDate(), { addSuffix: true }) : 'N/A'}</p>
                          </div>
                      </div>
                  )) : (
                     <div className="text-center py-10 text-muted-foreground">
                       No recent activity found.
                     </div>
                  )}
              </CardContent>
            </Card>
    </div>
  );
}
