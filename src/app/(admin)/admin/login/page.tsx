
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


const formSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});


type FormValues = z.infer<typeof formSchema>;

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      
      if (firestore) {
        const userRef = doc(firestore, 'users', userCredential.user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && userSnap.data().isAdmin) {
            toast({
                title: 'Logged In',
                description: 'Admin login successful.',
            });
            router.push('/admin/users');
        } else {
            await auth.signOut();
            toast({
                variant: 'destructive',
                title: 'Unauthorized',
                description: 'This account does not have admin privileges.',
            });
        }
      } else {
        throw new Error("Firestore is not available.");
      }

    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = 'Invalid email or password. Please try again.';
      } else {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-muted/50">
        <div className="w-full max-w-md">
             <div className="bg-primary text-primary-foreground p-6 rounded-t-lg">
                <h1 className="text-2xl font-bold">DocuEase Administration</h1>
             </div>
             <Card className="rounded-t-none">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6 pt-6">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                            <Input placeholder="admin@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                    <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                        {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Please wait
                        </>
                        ) : (
                        <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Log In
                        </>
                        )}
                    </Button>
                    </CardFooter>
                </form>
                </Form>
            </Card>
        </div>
    </div>
  );
}
