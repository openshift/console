import * as React from 'react';
import { ProvidedType } from '../../../selectors/vm-template/basic';

type TemplatesFilter = {
  text: string;
  provider: ProvidedType[];
  bootSource: string[];
};

export const useVmTemplatesFilters = (): [
  TemplatesFilter,
  (type: string, value: string) => void,
  (type?: string | { key: string; name: string }, id?: string) => void,
] => {
  const [filters, setFilters] = React.useState<TemplatesFilter>({
    text: undefined,
    provider: undefined,
    bootSource: undefined,
  });

  const onSelect = (type: string, value: string) => {
    if (type === 'text') {
      setFilters({ ...filters, text: value });
    } else if (!filters[type]?.includes(value)) {
      setFilters({
        ...filters,
        [type]: filters[type] ? [...filters[type], value] : [value],
      });
    } else {
      setFilters({
        ...filters,
        [type]: filters[type]?.filter((t) => t !== value),
      });
    }
  };

  const clearFilter = (type?: string | { key: string; name: string }, id?: string) => {
    if (!type && !id) {
      setFilters({
        text: undefined,
        provider: undefined,
        bootSource: undefined,
      });
    } else if (type && !id && typeof type !== 'string') {
      setFilters({
        ...filters,
        [type.key]: undefined,
      });
    } else if (typeof type === 'string' && id) {
      setFilters({
        ...filters,
        [type]: filters[type]?.filter((t) => t !== id),
      });
    }
  };

  return [filters, onSelect, clearFilter];
};
