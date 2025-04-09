import * as React from 'react';
import { SelectProps } from '@patternfly/react-core';
import { TypeaheadSelect, TypeaheadSelectOption } from '@patternfly/react-templates';
import { useTranslation } from 'react-i18next';

export const TypeaheadDropdown: React.FC<TypeaheadDropdownProps> = ({
  onChange,
  selectOptions,
  selectedKey = '',
  isCreatable = false,
  ...props
}) => {
  const { t } = useTranslation();
  const [options, setOptions] = React.useState(selectOptions);

  const initialOptions = React.useMemo<TypeaheadSelectOption[]>(
    () => options.map((o) => ({ ...o, selected: o.value === selectedKey })),
    [options, selectedKey],
  );

  return (
    <TypeaheadSelect
      id={props?.id}
      key={props?.id}
      initialOptions={initialOptions}
      placeholder={props?.placeholderText || t('Select options')}
      noOptionsFoundMessage={(filter) => `No state was found for "${filter}"`}
      aria-label={t('Select options')}
      onSelect={(_ev, selection) => {
        if (!options.find((o) => o.value === selection)) {
          setOptions([...options, { content: String(selection), value: String(selection) }]);
        }
        onChange(selection);
      }}
      onClearSelection={() => {
        onChange(undefined);
      }}
      selected={selectedKey}
      isCreatable={isCreatable}
    />
  );
};

export type TypeaheadDropdownProps = {
  id?: string;
  selectedKey?: string;
  placeholderText?: string;
  className?: string;
  selectOptions: { content: string; value: string }[];
  onChange: (selected: string | number) => void;
  onFilter?: SelectProps['onSelect'];
  isDisabled?: boolean;
  required?: boolean;
  isCreatable?: boolean;
};
