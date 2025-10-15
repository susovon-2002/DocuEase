'use client';

import SummarizeForm from './SummarizeForm';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { UpgradeProModal } from '@/components/UpgradeProModal';
import { Loader2 } from 'lucide-react';

function SummarizePdfContent() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

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

  const isLoading = isUserLoading || isUserProfileLoading || isSubscriptionLoading;

  const hasProPlan = subscription?.planType === 'Pro' || subscription?.planType === 'Business';
  
  // If not logged in, show the form directly.
  const showForm = !user || hasProPlan;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Smart PDF Summarizer</h1>
          <p className="text-muted-foreground mt-2">
            Upload your PDF and let our AI provide a concise summary. Choose your desired length.
          </p>
        </div>
        {isLoading && user ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : showForm ? (
          <SummarizeForm />
        ) : (
          <UpgradeProModal 
            title="Unlock Smart Summarizer"
            description="You need a Pro or Business plan to use the AI-powered PDF summarizer. Upgrade your plan to start generating summaries."
          />
        )}
      </div>
    </div>
  );
}


export default function SummarizePdfPage() {
  return (
      <SummarizePdfContent />
  )
}
