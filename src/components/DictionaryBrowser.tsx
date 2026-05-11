import { useState, useMemo, useCallback, useEffect, useTransition } from 'react';
import { Search, BookOpen, Star, ArrowLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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

/** Available difficulty levels for filtering */
const LEVEL_OPTIONS = [
  { value: 'all', label: '全部难度' },
  { value: 'junior', label: '初中' },
  { value: 'senior', label: '高中' },
  { value: 'cet4', label: 'CET-4' },
  { value: 'cet6', label: 'CET-6' },
  { value: 'ielts', label: '雅思' },
  { value: 'toefl', label: '托福' },
  { value: 'gre', label: 'GRE' },
];

interface DictionaryBrowserProps {
  onBack: () => void;
  /** If true, the "只看生词" filter will be enabled by default */
  showMarkedOnly?: boolean;
}

export function DictionaryBrowser(props: DictionaryBrowserProps) {
  const { onBack } = props;
  const [selectedDictionaryId, setSelectedDictionaryId] = useState<string>('cet4');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [showMarkedOnly, setShowMarkedOnly] = useState(
    // Initialize from sessionStorage flag or prop
    () => sessionStorage.getItem('dict-browser-marked-only') === 'true' ||
          props.showMarkedOnly === true
  );
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const { isMarked, toggleMark, getCount } = usePersonalWords();

  // Clear sessionStorage flag on mount if present
  useEffect(() => {
    if (sessionStorage.getItem('dict-browser-marked-only') === 'true') {
      sessionStorage.removeItem('dict-browser-marked-only');
    }
  }, []);

  // Debounce search query (300ms delay before applying filter)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle dictionary change
  const handleDictionaryChange = useCallback((value: string) => {
    setSelectedDictionaryId(value);
    setSearchQuery(''); // Clear search when dictionary changes
    setDebouncedSearch(''); // Clear debounced search when dictionary changes
    setLevelFilter('all'); // Reset level filter when dictionary changes
  }, []);

  // Handle level filter change
  const handleLevelFilterChange = useCallback((value: string) => {
    setLevelFilter(value);
  }, []);

  // Initial load and reload when dictionary changes
  useEffect(() => {
    let cancelled = false;

    startTransition(() => {
      setLoading(true);
      setError(null);
    });

    loadDictionary(selectedDictionaryId)
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
            setError('加载词典失败');
            setSentences([]);
            setLoading(false);
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDictionaryId]);

  // Filter sentences based on debounced search query, level filter, and marked status (case-insensitive)
  const filteredSentences = useMemo(() => {
    let result = sentences;

    // Apply level filter
    if (levelFilter !== 'all') {
      result = result.filter(sentence => sentence.level === levelFilter);
    }

    // Apply search filter (uses debounced value for 300ms delay)
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(sentence => {
        const word = sentence.blanks[0]?.word.toLowerCase() || '';
        const english = sentence.english.toLowerCase();
        const chinese = sentence.chinese.toLowerCase();
        return word.includes(query) || english.includes(query) || chinese.includes(query);
      });
    }

    // Apply marked filter
    if (showMarkedOnly) {
      result = result.filter(sentence => {
        const word = sentence.blanks[0]?.word || '';
        return isMarked(word);
      });
    }

    return result;
  }, [sentences, debouncedSearch, levelFilter, showMarkedOnly, isMarked]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="flex items-center gap-3 px-4 py-3 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">我的词库</h2>
        {getCount() > 0 && (
          <Badge variant="outline" className="ml-1">
            {getCount()}
          </Badge>
        )}
      </div>

      {/* Controls: Search, Level Filter and Dictionary Selector */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-4 border-b shrink-0">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索单词..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 min-w-0"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Switch
              id="show-marked-only"
              checked={showMarkedOnly}
              onCheckedChange={setShowMarkedOnly}
            />
            <label htmlFor="show-marked-only" className="text-sm cursor-pointer whitespace-nowrap">
              生词
            </label>
          </div>
          <Select value={levelFilter} onValueChange={handleLevelFilterChange}>
            <SelectTrigger className="w-[90px] sm:w-[130px]" title="按难度筛选">
              <Filter className="h-4 w-4 mr-1 shrink-0" />
              <SelectValue placeholder="难度" />
            </SelectTrigger>
            <SelectContent>
              {LEVEL_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDictionaryId} onValueChange={handleDictionaryChange}>
            <SelectTrigger className="w-[90px] sm:w-[140px]">
              <SelectValue placeholder="词典" />
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 pb-24 md:pb-4 supports-[height:100dvh]:h-[100dvh] supports-[height:100dvh]:max-h-[100dvh]">
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
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-w-0 auto-rows-auto">
            {filteredSentences.map(sentence => {
              const word = sentence.blanks[0]?.word || '';
              const marked = isMarked(word);

              return (
                <Card key={sentence.id} className="relative overflow-hidden min-w-0 flex flex-col">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8 z-10 shrink-0"
                    onClick={() => toggleMark(word)}
                    title={marked ? '取消标记' : '标记为生词'}
                  >
                    <Star
                      className={`h-4 w-4 ${marked ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                    />
                  </Button>
                  {marked && (
                    <Badge
                      variant="secondary"
                      className="absolute top-3 left-3 shrink-0"
                    >
                      新词
                    </Badge>
                  )}
                  <CardHeader className="pb-2 shrink-0">
                    <CardTitle className="text-xl truncate min-w-0">{word}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 min-w-0 shrink-0">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 truncate min-w-0">翻译</div>
                      <div className="text-sm break-words leading-relaxed overflow-wrap-anywhere truncate min-w-0">{sentence.chinese}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1 truncate min-w-0">例句</div>
                      <div className="text-sm text-foreground break-words leading-relaxed overflow-wrap-anywhere truncate min-w-0">{sentence.english}</div>
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
