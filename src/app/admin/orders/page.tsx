'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, setDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, Package, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';
import { AdminAuthWrapper } from '@/components/AdminAuthWrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

function AdminOrdersContent() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [rejectionTarget, setRejectionTarget] = useState<string | null>(null);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('orderDate', 'desc'));
  }, [firestore]);

  const { data: orders, isLoading, error } = useCollection(ordersQuery);

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    if (!firestore) return;
    setUpdatingOrders(prev => new Set(prev).add(orderId));
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await setDoc(orderRef, { status }, { merge: true });
      toast({ title: 'Success', description: `Order status updated to ${status}.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update order status.' });
    } finally {
      setUpdatingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
      if (rejectionTarget) setRejectionTarget(null);
    }
  };
  
  const handleRejectOrder = () => {
    if (rejectionTarget) {
      handleUpdateOrderStatus(rejectionTarget, 'Cancelled');
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return 'default';
      case 'shipped':
      case 'processing':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

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
        <p>Error loading orders: {error.message}</p>
        <p>Please ensure you have permission to view this data.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <AlertDialog open={!!rejectionTarget} onOpenChange={(open) => !open && setRejectionTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to reject this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the order as "Cancelled". You must manually process the refund through your payment provider's dashboard. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRejectOrder} className="bg-destructive hover:bg-destructive/90">
              Yes, Reject Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle>All User Orders</CardTitle>
          <CardDescription>A complete history of all orders placed on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders && orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium truncate max-w-[100px]">{order.id}</TableCell>
                    <TableCell className="truncate max-w-[100px]">{order.userId}</TableCell>
                    <TableCell>
                      {order.orderDate ? format(order.orderDate.toDate(), 'PPp') : 'N/A'}
                    </TableCell>
                    <TableCell>{order.orderType}</TableCell>
                    <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       {updatingOrders.has(order.id) ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleUpdateOrderStatus(order.id, 'Shipped')}
                                disabled={order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled'}
                              >
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                Confirm Order (Ship)
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                onClick={() => setRejectionTarget(order.id)}
                                disabled={order.status === 'Cancelled'}
                               >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-20">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders have been placed yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminOrdersPage() {
    return (
        <AdminAuthWrapper>
            <AdminOrdersContent />
        </AdminAuthWrapper>
    )
}
