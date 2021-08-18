import * as React from 'react';
import { InputGroup, InputGroupText, Spinner, TextInput } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import QuickSearchIcon from './QuickSearchIcon';
import './QuickSearchBar.scss';

interface QuickSearchBarProps {
  showNoResults: boolean;
  itemsLoaded: boolean;
  autoFocus: boolean;
  searchTerm: string;
  onSearch: (searchTerm: string) => void;
  searchPlaceholder: string;
  icon?: React.ReactNode;
}

const QuickSearchBar: React.FC<QuickSearchBarProps> = ({
  showNoResults,
  itemsLoaded,
  autoFocus = false,
  searchTerm,
  searchPlaceholder,
  onSearch,
  icon,
}) => {
  const { t } = useTranslation();

  return (
    <InputGroup className="ocs-quick-search-bar" data-test="quick-search-bar">
      <InputGroupText>{icon || <QuickSearchIcon />}</InputGroupText>
      <TextInput
        type="search"
        aria-label={t('console-shared~Quick search bar')}
        className="ocs-quick-search-bar__input"
        placeholder={searchPlaceholder}
        onChange={onSearch}
        autoFocus={autoFocus}
        value={searchTerm}
        data-test="input"
      />
      {!itemsLoaded && (
        <InputGroupText>
          <Spinner size="lg" />
        </InputGroupText>
      )}
      {itemsLoaded && showNoResults && (
        <InputGroupText>-- {t('console-shared~No results')}</InputGroupText>
      )}
    </InputGroup>
  );
};

export default QuickSearchBar;
