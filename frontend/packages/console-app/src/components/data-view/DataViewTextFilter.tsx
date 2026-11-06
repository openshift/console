import type { FormEvent } from 'react';
import { useState } from 'react';
import { ToolbarFilter } from '@patternfly/react-core';
import { useSearchParams } from 'react-router';
import { TextFilter } from '@console/internal/components/factory/text-filter';

type DataViewTextFilterProps = {
  title: string;
  filterId: string;
  placeholder: string;
  onChange?: (key: string, selectedValue: string) => void;
  showToolbarItem?: boolean;
};

export const DataViewTextFilter = ({
  title,
  filterId,
  placeholder,
  onChange,
  showToolbarItem,
}: DataViewTextFilterProps) => {
  const [searchParams] = useSearchParams();
  const [inputText, setInputText] = useState(searchParams.get(filterId) ?? '');

  // Sync local state with URL changes
  const [lastSyncedParams, setLastSyncedParams] = useState({ searchParams, filterId });
  if (lastSyncedParams.searchParams !== searchParams || lastSyncedParams.filterId !== filterId) {
    setLastSyncedParams({ searchParams, filterId });
    setInputText(searchParams.get(filterId) ?? '');
  }

  const handleChange = (_event: FormEvent<HTMLInputElement>, value: string) => {
    setInputText(value);
    onChange?.(filterId, value);
  };

  const handleDeleteChip = () => {
    setInputText('');
    onChange?.(filterId, '');
  };

  return (
    <ToolbarFilter
      categoryName={title}
      showToolbarItem={showToolbarItem}
      labels={inputText ? [inputText] : []}
      deleteLabel={handleDeleteChip}
    >
      <TextFilter
        label={filterId}
        placeholder={placeholder}
        value={inputText}
        onChange={handleChange}
      />
    </ToolbarFilter>
  );
};
