import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dictionaries } from '@/data/dictionaries';
import { PERSONAL_DICTIONARY_ID } from '@/data/types';
import { storage } from '@/services/storage';

interface DictionarySelectorProps {
  value?: string;
  onChange: (_value: string) => void;
  disabled?: boolean;
}

export function DictionarySelector({ value, onChange, disabled }: DictionarySelectorProps) {
  // Check if personal dictionary has active words
  const hasPersonalWords = useMemo(() => {
    const personalWords = storage.getPersonalWords();
    return personalWords.length > 0;
  }, []);

  return (
    <Select
      value={value}
      onValueChange={(newValue) => {
        // Prevent selecting personal dictionary if no words
        if (newValue === PERSONAL_DICTIONARY_ID && !hasPersonalWords) {
          return;
        }
        onChange(newValue);
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-[140px] h-9 text-sm">
        <SelectValue placeholder="选择词典" />
      </SelectTrigger>
      <SelectContent>
        {dictionaries.map((dict) => (
          <SelectItem key={dict.id} value={dict.id}>
            {dict.name}
          </SelectItem>
        ))}
        {hasPersonalWords && (
          <SelectItem value={PERSONAL_DICTIONARY_ID}>
            我的生词库
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
