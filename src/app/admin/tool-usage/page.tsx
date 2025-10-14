'use client';

import { useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Wrench } from 'lucide-react';
import { countBy, map } from 'lodash';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];


export default function AdminToolUsagePage() {
  const firestore = useFirestore();

  const allToolUsagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'toolUsages'));
  }, [firestore]);

  const { data: toolUsages, isLoading, error } = useCollection(allToolUsagesQuery);

  const toolUsageChartData = useMemo(() => {
    if (!toolUsages) return [];
    const counts = countBy(toolUsages, 'toolName');
    return map(counts, (value, name) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [toolUsages]);


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
        <p>Error loading data: {error.message}</p>
        <p>This can happen if Firestore Rules are not yet deployed. Please try again in a moment.</p>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Tool Usage Analytics</CardTitle>
          <CardDescription>An overview of the most popular tools across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {toolUsageChartData && toolUsageChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={toolUsageChartData} layout="vertical" margin={{ left: 120 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="value" name="Times Used" radius={[0, 4, 4, 0]}>
                  {toolUsageChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-20">
              <Wrench className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tools have been used yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
