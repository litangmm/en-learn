import type { WeaknessType } from '@/data/types';
import { Badge } from '@/components/ui/badge';

interface WeaknessTagProps {
  weakType: WeaknessType;
  className?: string;
}

const TYPE_CONFIG: Record<WeaknessType, { label: string; variant: 'destructive' | 'secondary' | 'default' | 'outline'; description: string }> = {
  'high-error': {
    label: '高频错误',
    variant: 'destructive',
    description: '错误次数过多',
  },
  'low-accuracy': {
    label: '低正确率',
    variant: 'destructive',
    description: '正确率低于 60%',
  },
  'review-neglected': {
    label: '久未复习',
    variant: 'secondary',
    description: '7 天以上未复习',
  },
  'mode-weak': {
    label: '模式薄弱',
    variant: 'outline',
    description: '特定模式表现弱',
  },
};

/**
 * Renders a colored tag for weakness type.
 * Uses shadcn/ui Badge component:
 * - destructive (red): high-error, low-accuracy
 * - secondary (gray): review-neglected
 * - outline: mode-weak
 */
export function WeaknessTag({ weakType, className }: WeaknessTagProps) {
  const config = TYPE_CONFIG[weakType] ?? TYPE_CONFIG['mode-weak'];

  return (
    <Badge
      variant={config.variant}
      className={className}
      title={config.description}
      data-testid={`weakness-tag-${weakType}`}
    >
      {config.label}
    </Badge>
  );
}

export default WeaknessTag;
