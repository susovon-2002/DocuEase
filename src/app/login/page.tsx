
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from 'firebase/auth';
import { Checkbox } from '@/components/ui/checkbox';
import { doc, serverTimestamp } from 'firebase/firestore';


const formSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  terms: z.boolean().optional(),
  captcha: z.string().min(1, 'Please solve the captcha.'),
}).refine((data) => {
    // Terms are only required for sign up
    if (data.terms === undefined) return true;
    return data.terms === true;
}, {
    message: "You must accept the terms and conditions.",
    path: ["terms"],
});


type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const generateCaptcha = () => {
    setCaptcha({
      num1: Math.floor(Math.random() * 10) + 1,
      num2: Math.floor(Math.random() * 10) + 1,
    });
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      captcha: '',
      terms: false,
    },
  });
  
  const createUserProfile = (user: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, `users/${user.uid}`);
    
    // By default, new users are not admins. This must be set manually in Firestore.
    const isAdmin = false;

    setDocumentNonBlocking(userRef, {
        id: user.uid,
        email: user.email,
        name: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL,
        registrationDate: serverTimestamp(),
        isAdmin: isAdmin,
        isRestricted: false,
    }, { merge: true });
  }

  const onSubmit = async (data: FormValues) => {
    const captchaAnswer = parseInt(data.captcha, 10);
    if (captchaAnswer !== captcha.num1 + captcha.num2) {
      toast({
        variant: 'destructive',
        title: 'Incorrect Captcha',
        description: 'Please solve the math problem correctly.',
      });
      generateCaptcha();
      form.setValue('captcha', '');
      return;
    }
    
    if (isSignUp && !data.terms) {
      toast({
        variant: 'destructive',
        title: 'Terms not accepted',
        description: 'You must accept the terms and conditions to sign up.',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        createUserProfile(userCredential.user);
        toast({
          title: 'Account Created',
          description: 'You have been successfully signed up.',
        });
      } else {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: 'Logged In',
          description: 'You have been successfully logged in.',
        });
      }
      router.push('/dashboard');
    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/email-already-in-use') {
        description = 'This email is already in use. Please try to sign in.';
      } else {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: description,
      });
      generateCaptcha();
      form.setValue('captcha', '');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center">
      <Card className="w-full max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{isSignUp ? 'Create an Account' : 'Sign In'}</CardTitle>
              <CardDescription>
                {isSignUp ? 'Enter your details to create an account.' : 'Enter your credentials to access your account.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
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
               <FormField
                control={form.control}
                name="captcha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Security Check: What is {captcha.num1} + {captcha.num2}?</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Your answer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isSignUp && (
                <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                                I accept the terms and conditions.
                            </FormLabel>
                            <p className="text-xs text-muted-foreground">
                                By signing up, you agree to our{' '}
                                <Link href="/terms" className="underline hover:text-primary">
                                Terms of Service
                                </Link>{' '}
                                and{' '}
                                <Link href="/privacy" className="underline hover:text-primary">
                                Privacy Policy
                                </Link>
                                .
                            </p>
                             <FormMessage />
                        </div>
                        </FormItem>
                    )}
                />
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={() => {
                    setIsSignUp(!isSignUp);
                    if (!isSignUp) {
                        form.register('terms');
                    } else {
                        form.unregister('terms');
                    }
                }}
                className="text-sm"
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
