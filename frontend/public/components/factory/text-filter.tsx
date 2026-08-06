import type { FC } from 'react';
import type { TextInputProps } from '@patternfly/react-core';
import { TextInput } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { KEYBOARD_SHORTCUTS } from '@console/shared/src/constants/common';
import { useDocumentListener } from '@console/shared/src/hooks/useDocumentListener';

type TextFilterProps = Omit<TextInputProps, 'type' | 'tabIndex'> & {
  label?: string;
};

export const TextFilter: FC<TextFilterProps> = (props) => {
  const { label, placeholder, autoFocus = false, ...otherInputProps } = props;
  const { ref } = useDocumentListener<HTMLInputElement>();
  const { t } = useTranslation('public');
  const placeholderText = placeholder ?? t('Filter {{label}}...', { label });

  return (
    <div className="co-text-filter">
      <TextInput
        className="co-text-filter__text-input"
        data-test="item-filter"
        data-test-id="item-filter"
        aria-label={placeholderText}
        placeholder={placeholderText}
        autoFocus={autoFocus}
        tabIndex={0}
        type="text"
        {...otherInputProps}
        ref={ref}
      />
      <span className="co-text-filter__feedback">
        <kbd className="co-kbd co-kbd__filter-input">{KEYBOARD_SHORTCUTS.focusFilterInput}</kbd>
      </span>
    </div>
  );
};
TextFilter.displayName = 'TextFilter';
