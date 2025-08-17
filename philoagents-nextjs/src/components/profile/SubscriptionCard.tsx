'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, Zap, Star } from 'lucide-react';
import type { UserSubscription } from '@/lib/services/mongodb/userService';

interface SubscriptionCardProps {
  subscription: UserSubscription;
}

const planConfig = {
  free: {
    name: 'Free',
    icon: Star,
    color: 'bg-gray-100 text-gray-800',
    description: 'Basic access to The BioTypes Arena',
  },
  pro: {
    name: 'Pro',
    icon: Zap,
    color: 'bg-blue-100 text-blue-800',
    description: 'Enhanced features and more conversations',
  },
  premium: {
    name: 'Premium',
    icon: Crown,
    color: 'bg-purple-100 text-purple-800',
    description: 'Unlimited access to all features',
  },
};

export default function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  // Safety check for subscription
  if (!subscription) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading subscription information...
      </div>
    );
  }

  const config = planConfig[subscription.plan];
  const Icon = config.icon;
  const usagePercentage = (subscription.conversationsUsed / subscription.monthlyConversations) * 100;

  const handleUpgrade = () => {
    // TODO: Integrate with Clerk Plans for subscription management
    window.open('https://clerk.com/docs/users/subscriptions', '_blank');
  };

  const getStatusBadge = () => {
    switch (subscription.status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800">Past Due</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${config.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">{config.name} Plan</h3>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Monthly Conversations</span>
          <span className="font-medium">
            {subscription.conversationsUsed} / {subscription.monthlyConversations}
          </span>
        </div>
        <Progress value={usagePercentage} className="h-2" />
        {usagePercentage >= 80 && (
          <p className="text-sm text-amber-600">
            You&apos;re approaching your monthly limit
          </p>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Resets on</span>
          <span className="font-medium">
            {new Date(subscription.resetDate).toLocaleDateString()}
          </span>
        </div>
        
        {subscription.currentPeriodEnd && (
          <div className="flex justify-between">
            <span className="text-gray-600">Current period ends</span>
            <span className="font-medium">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </span>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Your subscription will be canceled at the end of the current period.
            </p>
          </div>
        )}
      </div>

      {subscription.plan === 'free' && (
        <div className="pt-4 border-t">
          <Button onClick={handleUpgrade} className="w-full">
            Upgrade Plan
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Get more conversations and premium features
          </p>
        </div>
      )}

      {subscription.plan !== 'free' && (
        <div className="pt-4 border-t">
          <Button variant="outline" onClick={handleUpgrade} className="w-full">
            Manage Subscription
          </Button>
        </div>
      )}
    </div>
  );
}