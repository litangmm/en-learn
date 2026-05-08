import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dictionaries } from '@/data/dictionaries';

interface DictionarySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DictionarySelector({ value, onChange, disabled }: DictionarySelectorProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-[140px] h-9 text-sm">
        <SelectValue placeholder="选择词典" />
      </SelectTrigger>
      <SelectContent>
        {dictionaries.map((dict) => (
          <SelectItem key={dict.id} value={dict.id}>
            {dict.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
