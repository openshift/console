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
}

const QuickSearchBar: React.FC<QuickSearchBarProps> = ({
  showNoResults,
  itemsLoaded,
  autoFocus = false,
  searchTerm,
  onSearch,
}) => {
  const { t } = useTranslation();

  return (
    <InputGroup className="odc-quick-search-bar">
      <InputGroupText>
        <QuickSearchIcon />
      </InputGroupText>
      <TextInput
        type="search"
        aria-label={t('topology~Quick search bar')}
        className="odc-quick-search-bar__input"
        placeholder={`${t('topology~Add to Project')}...`}
        onChange={onSearch}
        autoFocus={autoFocus}
        value={searchTerm}
      />
      {!itemsLoaded && (
        <InputGroupText>
          <Spinner size="lg" />
        </InputGroupText>
      )}
      {itemsLoaded && showNoResults && (
        <InputGroupText>-- {t('topology~No results')}</InputGroupText>
      )}
    </InputGroup>
  );
};

export default QuickSearchBar;
