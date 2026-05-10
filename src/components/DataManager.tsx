import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Download,
  Upload,
  ArrowLeft,
  History,
  BookOpen,
  FileCheck,
  AlertCircle,
  BookMarked,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { storage } from '@/services/storage';
import type { View } from '@/components/routing/ViewRouter';

interface DataManagerProps {
  onBack: () => void;
  onNavigate?: (view: View) => void;
}

type ImportStatus =
  | { type: 'idle' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

export function DataManager({ onBack, onNavigate }: DataManagerProps) {
  const [historyCount] = useState(storage.getHistoryCount());
  const [mistakeCount] = useState(storage.getMistakeCount());
  const [hasActiveSession] = useState(storage.hasActiveSession());
  const [importStatus, setImportStatus] = useState<ImportStatus>({ type: 'idle' });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<unknown | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = useCallback(() => {
    const data = storage.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().split('T')[0];
    const filename = `en-learn-backup-${date}.json`;

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const parsed = JSON.parse(text);
          setPendingImportData(parsed);
          setShowConfirmDialog(true);
        } catch {
          setImportStatus({
            type: 'error',
            message: '导入失败：文件不是有效的 JSON 格式。',
          });
        }
      };
      reader.readAsText(file);

      // Reset input so the same file can be selected again
      event.target.value = '';
    },
    []
  );

  const handleConfirmImport = useCallback(() => {
    if (pendingImportData === null) return;

    const result = storage.importAllData(pendingImportData);
    if (result.success) {
      setImportStatus({ type: 'success', message: result.message });
    } else {
      setImportStatus({ type: 'error', message: result.message });
    }

    setShowConfirmDialog(false);
    setPendingImportData(null);
  }, [pendingImportData]);

  const handleCancelImport = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingImportData(null);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-slate-800">数据管理</h1>
          </div>
        </div>
      </div>

      {/* Data Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <History className="w-4 h-4" />
                学习记录
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-800">{historyCount} 次</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                错题数量
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-slate-800">{mistakeCount} 题</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                未完成会话
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-slate-800">
                  {hasActiveSession ? '有' : '无'}
                </p>
                {hasActiveSession && (
                  <Badge variant="secondary" className="text-xs">
                    可恢复
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Import Status */}
      {importStatus.type === 'success' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <FileCheck className="w-4 h-4 text-green-600" />
            <AlertDescription>{importStatus.message}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {importStatus.type === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{importStatus.message}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">数据操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleExport} className="w-full gap-2" variant="outline">
              <Download className="w-4 h-4" />
              导出数据
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full gap-2"
              variant="outline"
            >
              <Upload className="w-4 h-4" />
              导入数据
            </Button>
            {onNavigate && (
              <Button
                onClick={() => {
                  // Clear any existing flag so it opens in normal mode
                  sessionStorage.removeItem('dict-browser-marked-only');
                  onNavigate('dictionary-browser');
                }}
                className="w-full gap-2"
                variant="outline"
              >
                <BookMarked className="w-4 h-4" />
                我的词库
              </Button>
            )}
            {onNavigate && (
              <Button
                onClick={() => {
                  // Set flag so DictionaryBrowser opens with "只看生词" enabled
                  sessionStorage.setItem('dict-browser-marked-only', 'true');
                  onNavigate('dictionary-browser');
                }}
                className="w-full gap-2"
                variant="outline"
              >
                <BookMarked className="w-4 h-4" />
                生词本
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-input"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Import Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认导入数据</DialogTitle>
            <DialogDescription>
              导入数据将覆盖现有的学习记录、错题本和会话状态。此操作无法撤销。确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelImport}>
              取消
            </Button>
            <Button onClick={handleConfirmImport}>确认导入</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
