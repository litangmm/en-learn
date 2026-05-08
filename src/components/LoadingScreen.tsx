import { Headphones } from 'lucide-react';

interface LoadingScreenProps {
  dictionaryName?: string;
}

export function LoadingScreen({ dictionaryName }: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Headphones className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
        <p className="text-slate-600 font-medium">
          {dictionaryName ? `正在加载 ${dictionaryName}...` : '加载中...'}
        </p>
      </div>
    </div>
  );
}
