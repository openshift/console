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
  const inputRef = React.useRef<HTMLInputElement>(null);
  const spanRef = React.useRef<HTMLSpanElement>(null);
  return (
    <InputGroup
      onClick={() => inputRef.current?.focus()}
      className="ocs-quick-search-bar"
      data-test="quick-search-bar"
    >
      <InputGroupText className="ocs-quick-search-bar__border-none">
        {icon || <QuickSearchIcon />}
      </InputGroupText>
      <div className="ocs-quick-search-bar__input-wrapper">
        {/* <span> is only used to calculate the width of input based on the text in search */}
        <span className="ocs-quick-search-bar__input-dummy" ref={spanRef}>
          {searchTerm?.length > 0 ? searchTerm.replace(/ /g, '\u00a0') : searchPlaceholder}
        </span>
        <TextInput
          type="text"
          ref={inputRef}
          aria-label={t('console-shared~Quick search bar')}
          className="ocs-quick-search-bar__input"
          placeholder={searchPlaceholder}
          onChange={onSearch}
          autoFocus={autoFocus}
          value={searchTerm}
          data-test="input"
          style={{
            width: spanRef.current?.offsetWidth + 2 ?? '0px',
          }}
        />
        {itemsLoaded && showNoResults && (
          <InputGroupText className="ocs-quick-search-bar__border-none">
            &mdash; {t('console-shared~No results')}
          </InputGroupText>
        )}
      </div>
      {!itemsLoaded && (
        <InputGroupText className="ocs-quick-search-bar__border-none ocs-quick-search-bar__spinner">
          <Spinner size="lg" />
        </InputGroupText>
      )}
    </InputGroup>
  );
};

export default QuickSearchBar;
