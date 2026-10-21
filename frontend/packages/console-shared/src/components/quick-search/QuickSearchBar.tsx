import type { FormEvent, ReactNode } from 'react';
import { forwardRef } from 'react';
import {
  InputGroupText,
  Spinner,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import QuickSearchIcon from './QuickSearchIcon';

interface QuickSearchBarProps {
  showNoResults: boolean;
  itemsLoaded: boolean;
  autoFocus: boolean;
  searchTerm: string;
  onSearch: (event: FormEvent<HTMLInputElement>, searchTerm: string) => void;
  searchPlaceholder: string;
  icon?: ReactNode;
}

const QuickSearchBar = forwardRef<HTMLInputElement, QuickSearchBarProps>(
  (
    {
      showNoResults,
      itemsLoaded,
      autoFocus = false,
      searchTerm,
      searchPlaceholder,
      onSearch,
      icon,
    },
    inputRef,
  ) => {
    const { t } = useTranslation();
    return (
      <TextInputGroup data-test="quick-search-bar">
        <TextInputGroupMain
          type="text"
          ref={inputRef}
          aria-label={t('console-shared~Quick search bar')}
          placeholder={searchPlaceholder}
          onChange={onSearch}
          autoFocus={autoFocus}
          value={searchTerm}
          data-test="input"
          icon={icon || <QuickSearchIcon />}
        />
        {(!itemsLoaded || showNoResults) && (
          <TextInputGroupUtilities className="pf-v6-u-mr-md">
            {itemsLoaded && showNoResults && (
              <InputGroupText data-test="quick-search-no-results">
                {t('console-shared~No results')}
              </InputGroupText>
            )}
            {!itemsLoaded && (
              <InputGroupText>
                <Spinner diameter="1em" />
              </InputGroupText>
            )}
          </TextInputGroupUtilities>
        )}
      </TextInputGroup>
    );
  },
);

export default QuickSearchBar;
