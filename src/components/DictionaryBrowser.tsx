import { useState, useMemo, useCallback, useEffect, useTransition } from 'react';
import { Search, BookOpen, Star, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dictionaries } from '@/data/dictionaries';
import { loadDictionary } from '@/data/loader';
import { usePersonalWords } from '@/hooks/usePersonalWords';
import type { Sentence } from '@/data/types';

interface DictionaryBrowserProps {
  onBack: () => void;
}

export function DictionaryBrowser({ onBack }: DictionaryBrowserProps) {
  const [selectedDictionaryId, setSelectedDictionaryId] = useState<string>('cet4');
  const [searchQuery, setSearchQuery] = useState('');
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const { isMarked } = usePersonalWords();

  // Memoize the data loading function
  const loadDictionaryData = useCallback(async (dictionaryId: string) => {
    const data = await loadDictionary(dictionaryId);
    return data;
  }, []);

  // Handle dictionary change
  const handleDictionaryChange = useCallback((value: string) => {
    setSelectedDictionaryId(value);
    setSearchQuery(''); // Clear search when dictionary changes
  }, []);

  // Initial load and reload when dictionary changes
  useEffect(() => {
    let cancelled = false;

    startTransition(() => {
      setLoading(true);
      setError(null);
    });

    loadDictionaryData(selectedDictionaryId)
      .then(data => {
        if (!cancelled) {
          startTransition(() => {
            setSentences(data);
            setLoading(false);
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          startTransition(() => {
            setError('Failed to load dictionary');
            setSentences([]);
            setLoading(false);
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDictionaryId, loadDictionaryData]);

  // Filter sentences based on search query (case-insensitive)
  const filteredSentences = useMemo(() => {
    if (!searchQuery.trim()) {
      return sentences;
    }
    const query = searchQuery.toLowerCase();
    return sentences.filter(sentence => {
      const word = sentence.blanks[0]?.word.toLowerCase() || '';
      const english = sentence.english.toLowerCase();
      const chinese = sentence.chinese.toLowerCase();
      return word.includes(query) || english.includes(query) || chinese.includes(query);
    });
  }, [sentences, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">我的词库</h2>
      </div>

      {/* Controls: Search and Dictionary Selector */}
      <div className="flex gap-3 p-4 border-b">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索单词..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedDictionaryId} onValueChange={handleDictionaryChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="选择词典" />
          </SelectTrigger>
          <SelectContent>
            {dictionaries.map(dict => (
              <SelectItem key={dict.id} value={dict.id}>
                {dict.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">加载中...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-32">
            <div className="text-destructive">{error}</div>
          </div>
        )}

        {!loading && !error && filteredSentences.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <BookOpen className="h-8 w-8 mb-2" />
            <div>
              {searchQuery ? '未找到匹配的单词' : '该词典暂无单词'}
            </div>
          </div>
        )}

        {!loading && !error && filteredSentences.length > 0 && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredSentences.map(sentence => {
              const word = sentence.blanks[0]?.word || '';
              const marked = isMarked(word);

              return (
                <Card key={sentence.id} className="relative">
                  {marked && (
                    <Badge
                      variant="secondary"
                      className="absolute top-3 right-3"
                    >
                      <Star className="h-3 w-3 fill-current mr-1" />
                      新词
                    </Badge>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{word}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">翻译</div>
                      <div className="text-sm">{sentence.chinese}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">例句</div>
                      <div className="text-sm text-foreground">{sentence.english}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {sentence.chinese}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with count */}
      {!loading && !error && (
        <div className="px-4 py-3 border-t text-sm text-muted-foreground">
          共 {filteredSentences.length} 个单词
          {searchQuery && sentences.length !== filteredSentences.length && (
            <span>（共 {sentences.length} 个）</span>
          )}
        </div>
      )}
    </div>
  );
}