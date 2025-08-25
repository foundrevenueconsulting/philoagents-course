'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Crown, Zap, Star } from 'lucide-react';
import type { UserSubscription } from '@/lib/services/mongodb/userService';
import { Dictionary, Locale } from '@/lib/dictionaries';

interface SubscriptionCardContentProps {
  subscription: UserSubscription;
  dict: Dictionary;
  locale: Locale;
}

export default function SubscriptionCardContent({ subscription, dict, locale }: SubscriptionCardContentProps) {
  // Safety check for subscription
  if (!subscription) {
    return (
      <div className="p-4 text-center text-gray-500">
        {dict.profile.loading_subscription}
      </div>
    );
  }

  const planConfig = {
    free: {
      name: dict.profile.plan_free_name,
      icon: Star,
      color: 'bg-gray-100 text-gray-800',
      description: dict.profile.plan_free_desc,
    },
    pro: {
      name: dict.profile.plan_pro_name,
      icon: Zap,
      color: 'bg-blue-100 text-blue-800',
      description: dict.profile.plan_pro_desc,
    },
    premium: {
      name: dict.profile.plan_premium_name,
      icon: Crown,
      color: 'bg-purple-100 text-purple-800',
      description: dict.profile.plan_premium_desc,
    },
  };

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
        return <Badge className="bg-green-100 text-green-800">{dict.profile.status_active}</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">{dict.profile.status_inactive}</Badge>;
      case 'canceled':
        return <Badge className="bg-red-100 text-red-800">{dict.profile.status_canceled}</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-100 text-yellow-800">{dict.profile.status_past_due}</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{dict.profile.status_unknown}</Badge>;
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
            <h3 className="font-semibold">{config.name} {dict.profile.plan_suffix}</h3>
            <p className="text-sm text-gray-600">{config.description}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{dict.profile.monthly_conversations}</span>
          <span className="font-medium">
            {subscription.conversationsUsed} / {subscription.monthlyConversations}
          </span>
        </div>
        <Progress value={usagePercentage} className="h-2" />
        {usagePercentage >= 80 && (
          <p className="text-sm text-amber-600">
            {dict.profile.approaching_limit}
          </p>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">{dict.profile.resets_on}</span>
          <span className="font-medium">
            {new Date(subscription.resetDate).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US')}
          </span>
        </div>
        
        {subscription.currentPeriodEnd && (
          <div className="flex justify-between">
            <span className="text-gray-600">{dict.profile.current_period_ends}</span>
            <span className="font-medium">
              {new Date(subscription.currentPeriodEnd).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US')}
            </span>
          </div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {dict.profile.cancel_notice}
            </p>
          </div>
        )}
      </div>

      {subscription.plan === 'free' && (
        <div className="pt-4 border-t">
          <Button onClick={handleUpgrade} className="w-full">
            {dict.profile.upgrade_plan}
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {dict.profile.upgrade_plan_desc}
          </p>
        </div>
      )}

      {subscription.plan !== 'free' && (
        <div className="pt-4 border-t">
          <Button variant="outline" onClick={handleUpgrade} className="w-full">
            {dict.profile.manage_subscription}
          </Button>
        </div>
      )}
    </div>
  );
}