
'use client';

import { useMemo, useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, setDoc, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader2, Package, MoreHorizontal, CheckCircle, XCircle, User, Phone, Mail, MapPin, Printer, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [updatingOrders, setUpdatingOrders] = useState<Set<string>>(new Set());
  const [rejectionTarget, setRejectionTarget] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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
        return 'secondary';
      case 'processing':
        return 'outline';
       case 'pending':
        return 'secondary';
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
      <div className="container mx-auto px-4 py-12 text-center text-destructive">
        <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h2 className="text-xl font-bold">Permission Error</h2>
        <p>Could not load orders. This can happen if Firestore Security Rules are not yet deployed or do not allow admin access.</p>
        <p className="text-sm mt-2">Please wait a moment and refresh the page. If the issue persists, check your Firestore rules.</p>
      </div>
    );
  }

  return (
    <div>
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
                        <TableHead className="w-[80px]"></TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => (
                        <React.Fragment key={order.id}>
                            <TableRow onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="cursor-pointer">
                                <TableCell>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        {expandedOrderId === order.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                </TableCell>
                                <TableCell className="font-medium truncate max-w-[120px]">{order.id}</TableCell>
                                <TableCell className="truncate max-w-[150px]">{order.deliveryAddress?.name || order.userId}</TableCell>
                                <TableCell>{order.orderDate ? format(order.orderDate.toDate(), 'PP') : 'N/A'}</TableCell>
                                <TableCell><Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge></TableCell>
                                <TableCell className="text-right font-medium">₹{order.totalAmount.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                     {updatingOrders.has(order.id) ? (
                                        <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                                    ) : (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                onClick={(e) => { e.stopPropagation(); handleUpdateOrderStatus(order.id, 'Shipped'); }}
                                                disabled={order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled'}
                                                >
                                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                Confirm & Ship
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                onClick={(e) => { e.stopPropagation(); setRejectionTarget(order.id); }}
                                                disabled={order.status === 'Cancelled' || order.status === 'Delivered'}
                                                >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Reject Order
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                             {expandedOrderId === order.id && (
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableCell colSpan={7} className="p-0">
                                         <div className="p-6 grid md:grid-cols-3 gap-6">
                                            <div className="md:col-span-1 space-y-4">
                                                <h4 className="font-semibold">Delivery Details</h4>
                                                <div className="space-y-2 text-sm text-muted-foreground">
                                                    <p className="flex items-start"><User className="w-4 h-4 mr-2 mt-1 shrink-0"/> {order.deliveryAddress?.name}</p>
                                                    <p className="flex items-start"><Mail className="w-4 h-4 mr-2 mt-1 shrink-0"/> {order.deliveryAddress?.email}</p>
                                                    <p className="flex items-start"><Phone className="w-4 h-4 mr-2 mt-1 shrink-0"/> {order.deliveryAddress?.mobile}</p>
                                                    <p className="flex items-start"><MapPin className="w-4 h-4 mr-2 mt-1 shrink-0"/> {order.deliveryAddress?.address}, {order.deliveryAddress?.pincode}</p>
                                                </div>
                                                <Separator />
                                                <h4 className="font-semibold">Payment Details</h4>
                                                <div className="space-y-2 text-sm text-muted-foreground">
                                                    <p><strong>Provider:</strong> {order.paymentDetails?.paymentProvider}</p>
                                                    <p><strong>Method:</strong> {order.paymentDetails?.paymentMethod}</p>
                                                    <p className="truncate"><strong>Transaction ID:</strong> {order.paymentDetails?.transactionId}</p>
                                                </div>
                                            </div>
                                            <div className="md:col-span-2">
                                                <h4 className="font-semibold mb-4">Order Items ({order.orderType})</h4>
                                                <div className="space-y-4 max-h-64 overflow-y-auto">
                                                    {order.items?.map((item: any, index: number) => (
                                                        <div key={index} className="flex gap-4 p-2 border rounded-md bg-background">
                                                            <img src={item.thumbnail} alt={item.name} className="w-20 h-20 object-contain rounded-md bg-muted" />
                                                            <div className="flex-grow">
                                                                <p className="font-medium text-sm truncate">{item.name}</p>
                                                                <p className="text-xs text-muted-foreground">{item.type}</p>
                                                                <p className="text-xs text-muted-foreground">{item.details}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
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

    