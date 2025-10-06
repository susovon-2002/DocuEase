'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection } from 'firebase/firestore';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, formatDistanceToNow, startOfWeek } from 'date-fns';
import { groupBy, countBy } from 'lodash';

export default function DashboardPage() {
  const { user, isUserLoading, userError } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();

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
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out: ', error);
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
  
  const isLoading = isUserLoading || toolUsagesLoading || documentsLoading;

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
            Welcome back, {user.email}!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            <Card>
                <CardHeader>
                    <CardTitle>Subscription</CardTitle>
                </CardHeader>
                <CardContent>
                    <Badge>Pro</Badge>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <Badge variant="secondary">Active</Badge>
                </CardContent>
            </Card>
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
        </div>

        <Card>
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


        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Account</CardTitle>
            <CardDescription>
              Here's some information about your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
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
}
