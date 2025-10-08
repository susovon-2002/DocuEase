
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, doc, query, where, setDoc, Timestamp } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow, startOfWeek } from 'date-fns';
import { groupBy, countBy } from 'lodash';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle, Award, Trophy, Star, Edit, Rocket, Zap, Activity, FileStack, Wrench, Package, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AchievementBadge } from '@/components/AchievementBadge';
import Link from 'next/link';


export default function DashboardPage() {
  const { user, isUserLoading: isAuthUserLoading, userError } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProfileSaving, setProfileSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editRole, setEditRole] = useState('');
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);

  const userProfileQuery = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, `users/${user.uid}`);
  }, [firestore, user]);
  
  const { data: userProfile, isLoading: isUserProfileLoading } = useDoc(userProfileQuery);
  
  useEffect(() => {
    if (!isAuthUserLoading && user && userProfile && userProfile.isRestricted) {
        toast({
            variant: 'destructive',
            title: 'Account Restricted',
            description: 'Your access has been restricted. Please contact support.',
            duration: Infinity,
        });
        signOut(auth);
        router.push('/login');
    }
  }, [user, userProfile, isAuthUserLoading, auth, router, toast]);

  const subscriptionQuery = useMemoFirebase(() => {
    if (!firestore || !userProfile?.subscriptionId) return null;
    return doc(firestore, 'subscriptions', userProfile.subscriptionId);
  }, [firestore, userProfile?.subscriptionId]);

  const { data: subscription, isLoading: isSubscriptionLoading } = useDoc(subscriptionQuery);

  const toolUsagesQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/toolUsages`);
  }, [firestore, user]);

  const documentsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/documents`);
  }, [firestore, user]);
  
  const ordersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'orders'), where('userId', '==', user.uid));
  }, [firestore, user]);

  const { data: toolUsages, isLoading: toolUsagesLoading } = useCollection(toolUsagesQuery);
  const { data: documents, isLoading: documentsLoading } = useCollection(documentsQuery);
  const { data: orders, isLoading: ordersLoading } = useCollection(ordersQuery);


  useEffect(() => {
    if (!isAuthUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthUserLoading, router]);

  useEffect(() => {
    if (userProfile) {
        setEditName(userProfile.name || '');
        setEditCompany(userProfile.company || '');
        setEditRole(userProfile.role || '');
    }
  }, [userProfile]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfileQuery) return;
    setProfileSaving(true);
    try {
      await setDoc(userProfileQuery, {
        name: editName,
        company: editCompany,
        role: editRole,
      }, { merge: true });
      toast({ title: "Profile Updated", description: "Your profile has been saved successfully."});
      setEditProfileOpen(false);
    } catch(e) {
      toast({ variant: "destructive", title: "Error", description: "Could not save profile." });
    } finally {
      setProfileSaving(false);
    }
  };

  const toolUsageChartData = useMemo(() => {
    if (!toolUsages) return [];
    const counts = countBy(toolUsages, 'toolName');
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [toolUsages]);
  
  const documentsByWeekData = useMemo(() => {
      if (!documents) return [];
      const groupedByWeek = groupBy(documents, (doc) => {
          // Firestore Timestamp objects have a toDate() method
          const date = doc.uploadDate instanceof Timestamp ? doc.uploadDate.toDate() : new Date(doc.uploadDate);
          return format(startOfWeek(date), 'MMM d');
      });
      return Object.entries(groupedByWeek)
          .map(([week, docs]) => ({
              week,
              count: docs.length
          }))
          .sort((a,b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  }, [documents]);

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

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
  
  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
        const dateA = a.orderDate instanceof Timestamp ? a.orderDate.toDate() : new Date(a.orderDate);
        const dateB = b.orderDate instanceof Timestamp ? b.orderDate.toDate() : new Date(b.orderDate);
        return dateB.getTime() - dateA.getTime();
    });
  }, [orders]);


  const achievements = useMemo(() => {
    const earned = [];
    const docCount = documents?.length || 0;
    const toolCount = toolUsages?.length || 0;
    
    if (docCount >= 1) earned.push({ id: 'first-doc', icon: Award, title: 'First Document', description: 'Processed your first document!' });
    if (docCount >= 10) earned.push({ id: 'ten-docs', icon: Trophy, title: 'Document Pro', description: 'Processed 10 documents!' });
    if (docCount >= 50) earned.push({ id: 'fifty-docs', icon: Star, title: 'Document Master', description: 'Processed 50 documents!' });
    if (toolCount >= 1) earned.push({ id: 'first-tool', icon: Award, title: 'Tool Explorer', description: 'Used your first tool!' });
    if (toolCount >= 25) earned.push({ id: 'twenty-five-tools', icon: Trophy, title: 'Tool Specialist', description: 'Used tools 25 times!' });

    return earned;
  }, [documents, toolUsages]);
  
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
  
  const isLoading = isAuthUserLoading || toolUsagesLoading || documentsLoading || isUserProfileLoading || isSubscriptionLoading || ordersLoading;

  if (isLoading) {
    return <div className="container mx-auto px-4 py-12">Loading...</div>;
  }

  if (userError) {
    return <div className="container mx-auto px-4 py-12">Error loading user.</div>;
  }
  
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12 bg-secondary/50">
      <div className="w-full max-w-7xl mx-auto">
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {userProfile?.name || user.email}!
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                        <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{orders?.filter(o => ['Pending', 'Processing', 'Shipped'].includes(o.status)).length || 0}</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
              <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                  <CardDescription>
                      Number of documents processed per week.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={documentsByWeekData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{ fill: 'hsl(var(--muted))' }}/>
                          <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Documents" />
                      </BarChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>
            
             <Card>
              <CardHeader>
                <CardTitle>Order History</CardTitle>
                <CardDescription>
                  Your recent print and delivery orders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sortedOrders && sortedOrders.length > 0 ? (
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
                      {sortedOrders.slice(0,5).map((order) => (
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
                  <div className="text-center py-10">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">You have no orders yet.</p>
                     <Button asChild variant="link" className="mt-2">
                        <Link href="/print-delivery">Place an order</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>


            {(subscription?.planType !== 'Pro' && subscription?.planType !== 'Business') && (
              <Card className="bg-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center"><Zap className="w-5 h-5 mr-2 text-primary"/> Unlock Premium Tool</CardTitle>
                  <CardDescription>Upgrade your plan to access our most powerful features.</CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-2">AI Smart Summarizer</h3>
                  <p className="text-muted-foreground mb-4">Let our AI create a professional summary from your PDF in seconds. Perfect for students, researchers, and professionals.</p>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href="/pricing">Upgrade Now</Link>
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
          {/* Side column */}
          <div className="space-y-8">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Your Profile</CardTitle>
                  <Dialog open={isEditProfileOpen} onOpenChange={setEditProfileOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                          </div>
                           <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={user.email || ''} disabled />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input id="company" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Input id="role" value={editRole} onChange={(e) => setEditRole(e.target.value)} />
                          </div>
                      </div>
                      <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <Button onClick={handleSaveProfile} disabled={isProfileSaving}>
                            {isProfileSaving ? 'Saving...' : 'Save'}
                          </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24 mb-4 border-4 border-background shadow-md">
                        <AvatarImage src={userProfile?.photoURL || user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} />
                        <AvatarFallback><UserCircle className="w-12 h-12" /></AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{userProfile?.name || user.email}</h3>
                    <p className="text-muted-foreground text-sm">{userProfile?.role}{userProfile?.role && userProfile?.company ? ' at ' : ''}{userProfile?.company}</p>
                    <p className="text-muted-foreground text-xs mt-2">{user.email}</p>
                     {userProfile?.isAdmin && (
                        <Badge variant="secondary" className="mt-4"><Shield className="w-3 h-3 mr-1" />Admin</Badge>
                     )}
                </CardContent>
                 <CardFooter className="flex-col gap-2">
                   <Button onClick={handleLogout} variant="outline" className="w-full">
                      Log Out
                    </Button>
                 </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                    {subscription ? (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Current Plan</span>
                                <Badge variant={(subscription.planType === 'Pro' || subscription.planType === 'Business') ? 'default' : 'secondary'}>{subscription.planType}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Renews On</span>
                                <span>{subscription.endDate ? format(subscription.endDate.toDate(), 'MMMM d, yyyy') : 'N/A'}</span>
                            </div>
                             <Button asChild className="w-full mt-4">
                                <Link href="/pricing">Manage Subscription</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-muted-foreground mb-4">You are on the free plan.</p>
                             <Button asChild className="w-full">
                                <Link href="/pricing">Upgrade to Pro</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                      Your latest actions.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {recentActivities.map(activity => (
                      <div key={activity.id} className="flex items-center">
                          <Activity className="h-4 w-4 mr-4 text-muted-foreground" />
                          <div className="flex-grow">
                              <p className="text-sm font-medium">{activity.toolName}</p>
                              <p className="text-xs text-muted-foreground">{activity.usageTimestamp ? formatDistanceToNow(activity.usageTimestamp.toDate(), { addSuffix: true }) : 'N/A'}</p>
                          </div>
                      </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                  <CardDescription>Badges you've earned.</CardDescription>
              </CardHeader>
              <CardContent>
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {achievements.map(ach => (
                      <AchievementBadge key={ach.id} icon={ach.icon} title={ach.title} description={ach.description} />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No badges earned yet. Keep using the tools to unlock them!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>


        <div className="grid grid-cols-1 gap-6 mb-8">
             <Card>
                <CardHeader>
                    <CardTitle>Tool Usage Breakdown</CardTitle>
                     <CardDescription>
                        A look at your most used tools.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={toolUsageChartData} layout="vertical" margin={{ left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                          <Tooltip cursor={{ fill: 'hsl(var(--muted))' }}/>
                          <Bar dataKey="value" name="Times Used" radius={[0, 4, 4, 0]}>
                            {toolUsageChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

    
