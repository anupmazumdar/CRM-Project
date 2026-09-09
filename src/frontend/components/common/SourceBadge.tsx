import React from 'react';
import { getSourceInfo } from '@/frontend/utils/ui-helpers';
import { Globe, MessageCircle, Users, Footprints, Share2, Mail, Award, HelpCircle } from 'lucide-react';

interface SourceBadgeProps {
  source: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, className = '', size = 'md' }) => {
  const info = getSourceInfo(source);

  const renderIcon = () => {
    switch (info.icon) {
      case 'Globe':
        return <Globe className="w-3 h-3" />;
      case 'MessageCircle':
        return <MessageCircle className="w-3 h-3" />;
      case 'Users':
        return <Users className="w-3 h-3" />;
      case 'Footprints':
        return <Footprints className="w-3 h-3" />;
      case 'Share2':
        return <Share2 className="w-3 h-3" />;
      case 'Mail':
        return <Mail className="w-3 h-3" />;
      case 'Award':
        return <Award className="w-3 h-3" />;
      default:
        return <HelpCircle className="w-3 h-3" />;
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border ${info.color} ${sizeClass} ${className}`}
    >
      {renderIcon()}
      <span>{info.label}</span>
    </span>
  );
};
