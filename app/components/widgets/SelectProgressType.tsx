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

export function SelectProgressType() {
  return (
    <Select>
      <SelectTrigger className="w-full max-w-48">
        <SelectValue placeholder="Rodzaj postępu" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Postęp</SelectLabel>
          <SelectItem value="step_progress">Od ostatniego pomiaru</SelectItem>
          <SelectItem value="overall_progress">Od początku pomiarów</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
