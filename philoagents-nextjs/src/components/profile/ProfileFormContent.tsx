'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/services/mongodb/userService';
import { Dictionary } from '@/lib/dictionaries';

interface ProfileFormContentProps {
  user: User;
  dict: Dictionary;
}

export default function ProfileFormContent({ user, dict }: ProfileFormContentProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user.displayName || '',
    username: user.username || '',
    bio: user.bio || '',
  });
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || dict.profile.failed_to_update);
      }

      toast({
        title: dict.profile.profile_updated,
        description: dict.profile.profile_updated_desc,
      });

      router.refresh();
    } catch (error) {
      toast({
        title: dict.profile.error,
        description: error instanceof Error ? error.message : dict.profile.failed_to_update,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="displayName">{dict.profile.display_name}</Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          placeholder={dict.profile.display_name_placeholder}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          {dict.profile.display_name_help}
        </p>
      </div>

      <div>
        <Label htmlFor="username">{dict.profile.username}</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          placeholder={dict.profile.username_placeholder}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          {dict.profile.username_help}
        </p>
      </div>

      <div>
        <Label htmlFor="bio">{dict.profile.bio}</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder={dict.profile.bio_placeholder}
          className="mt-1"
          rows={3}
        />
        <p className="text-sm text-gray-500 mt-1">
          {dict.profile.bio_help}
        </p>
      </div>

      <div className="pt-4">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? dict.profile.updating : dict.profile.update_profile}
        </Button>
      </div>
    </form>
  );
}