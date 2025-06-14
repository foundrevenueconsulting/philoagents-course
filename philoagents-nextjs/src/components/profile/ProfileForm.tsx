'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/services/mongodb/userService';

interface ProfileFormProps {
  user: User;
}

export default function ProfileForm({ user }: ProfileFormProps) {
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
        throw new Error(error.message || 'Failed to update profile');
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
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
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          value={formData.displayName}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          placeholder="Enter your display name"
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          This is how your name will appear to other users
        </p>
      </div>

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => handleInputChange('username', e.target.value)}
          placeholder="Enter your username"
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          Must be unique and contain only letters, numbers, and underscores
        </p>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          placeholder="Tell us about yourself..."
          className="mt-1"
          rows={3}
        />
        <p className="text-sm text-gray-500 mt-1">
          Optional bio to share with other users
        </p>
      </div>

      <div className="pt-4">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
      </div>
    </form>
  );
}