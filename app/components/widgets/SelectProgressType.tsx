'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProgressMode } from '@/lib/domain/progress';

type Props = {
  value: ProgressMode;
  onChange: (value: ProgressMode) => void;
};

export function SelectProgressType({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full min-w-[220px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="step">Od ostatniego pomiaru</SelectItem>
        <SelectItem value="overall">Od początku</SelectItem>
      </SelectContent>
    </Select>
  );
}
