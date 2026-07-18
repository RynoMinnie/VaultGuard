'use client';

import React from 'react';
import {
  Globe,
  Github,
  Mail,
  MessageCircle,
  Users,
  ShoppingCart,
  Play,
  MessageSquare,
  Cloud,
  Briefcase,
  Hash,
  Music,
} from 'lucide-react';

const platformMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  github: Github,
  google: Mail,
  gmail: Mail,
  twitter: MessageCircle,
  x: MessageCircle,
  facebook: Users,
  meta: Users,
  amazon: ShoppingCart,
  netflix: Play,
  youtube: Play,
  twitch: Play,
  slack: MessageSquare,
  discord: MessageSquare,
  aws: Cloud,
  digitalocean: Cloud,
  vercel: Cloud,
  linkedin: Briefcase,
  reddit: Hash,
  spotify: Music,
};

const DefaultIcon = Globe;

export function PlatformIconDisplay({ platform, className }: { platform: string; className?: string }) {
  const key = platform.toLowerCase().trim();
  const Icon = platformMap[key] ?? DefaultIcon;
  return <Icon className={className} />;
}