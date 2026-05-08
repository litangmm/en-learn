import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorScreenProps {
  message: string;
  onRetry: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <p className="text-slate-700 font-medium mb-2">加载失败</p>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <Button onClick={onRetry}>重试</Button>
      </div>
    </div>
  );
}
