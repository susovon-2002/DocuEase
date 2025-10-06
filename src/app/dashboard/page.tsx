'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, doc, query, where, setDoc } from 'firebase/firestore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow, startOfWeek } from 'date-fns';
import { groupBy, countBy } from 'lodash';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserCircle, Award, Trophy, Star, Edit, Rocket, Zap } from 'lucide-react';
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

  const { data: toolUsages, isLoading: toolUsagesLoading } = useCollection(toolUsagesQuery);
  const { data: documents, isLoading: documentsLoading } = useCollection(documentsQuery);


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
      const groupedByWeek = groupBy(documents, (doc) => 
          format(startOfWeek(new Date(doc.uploadDate)), 'yyyy-MM-dd')
      );
      return Object.entries(groupedByWeek)
          .map(([week, docs]) => ({
              week,
              count: docs.length
          }))
          .sort((a,b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  }, [documents]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const recentActivities = useMemo(() => {
    if (!toolUsages) return [];
    return [...toolUsages]
      .sort((a, b) => new Date(b.usageTimestamp).getTime() - new Date(a.usageTimestamp).getTime())
      .slice(0, 5);
  }, [toolUsages]);

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
  
  const isLoading = isAuthUserLoading || toolUsagesLoading || documentsLoading || isUserProfileLoading || isSubscriptionLoading;

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
    <div className="container mx-auto px-4 py-12">
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {userProfile?.name || user.email}!
          </p>
        </div>

        <Card className="mb-8 bg-accent/20 border-accent/50">
          <CardContent className="p-6 flex items-center justify-center">
              <Rocket className="w-6 h-6 mr-4 text-accent-foreground" />
              <p className="text-lg font-medium text-accent-foreground">
                You saved 10 hours this month using DocuEase 🚀
              </p>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Documents Processed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{documents?.length || 0}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Tools Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{toolUsages?.length || 0}</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
              <CardHeader>
                  <CardTitle>Documents Processed Over Time</CardTitle>
                  <CardDescription>
                      Weekly document processing count.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={documentsByWeekData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" tickFormatter={(tick) => format(new Date(tick), 'MMM d')} />
                          <YAxis allowDecimals={false} />
                          <Tooltip />
                          <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" name="Documents" />
                      </LineChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>
            {subscription?.planType !== 'Pro' && (
              <Card className="bg-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center"><Zap className="w-5 h-5 mr-2 text-primary"/> Unlock Premium Tool</CardTitle>
                  <CardDescription>Upgrade your plan to access our most powerful features.</CardDescription>
                </CardHeader>
                <CardContent>
                  <h3 className="font-semibold text-lg mb-2">AI Cover Letter Generator</h3>
                  <p className="text-muted-foreground mb-4">Let our AI create a professional cover letter from your resume in seconds. Impress employers and land your dream job faster.</p>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href="/pricing">Upgrade Now</Link>
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
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
                    <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={userProfile?.photoURL || user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} />
                        <AvatarFallback><UserCircle className="w-12 h-12" /></AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{userProfile?.name || user.email}</h3>
                    <p className="text-muted-foreground text-sm">{userProfile?.role}{userProfile?.role && userProfile?.company ? ' at ' : ''}{userProfile?.company}</p>
                    <p className="text-muted-foreground text-xs mt-2">{user.email}</p>
                </CardContent>
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
                                <Badge variant={subscription.planType === 'Pro' ? 'default' : 'secondary'}>{subscription.planType}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Renews On</span>
                                <span>{format(new Date(subscription.endDate), 'MMMM d, yyyy')}</span>
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


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
             <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Tool Usage Breakdown</CardTitle>
                     <CardDescription>
                        A look at your most used tools.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={toolUsageChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {toolUsageChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-1">
              <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                      Here are the latest actions you've performed.
                  </CardDescription>
              </CardHeader>
              <CardContent>
                 <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Tool</TableHead>
                              <TableHead className="text-right">Time</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {recentActivities.map(activity => (
                              <TableRow key={activity.id}>
                                  <TableCell>{activity.toolName}</TableCell>
                                  <TableCell className="text-right">{formatDistanceToNow(new Date(activity.usageTimestamp), { addSuffix: true })}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </CardContent>
            </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">User ID</h3>
              <p className="text-muted-foreground text-sm">{user.uid}</p>
            </div>
            <Button onClick={handleLogout} variant="destructive">
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
