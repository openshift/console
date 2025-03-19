import * as React from 'react';
import {
  FormGroup,
  EmptyState,
  Button,
  TextInput,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { useField, useFormikContext, FormikValues } from 'formik';
import * as fuzzy from 'fuzzysearch';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { LoadingInline } from '@console/internal/components/utils';
import { useDebounceCallback } from '../../../hooks/debounce';
import { RedExclamationCircleIcon } from '../../status';
import { getFieldId } from '../field-utils';
import SelectorCard from './SelectorCard';
import './ItemSelectorField.scss';

interface Item {
  name: string;
  title: string;
  displayName?: string;
  iconUrl?: string;
}

interface NormalizedItem {
  [item: string]: Item;
}

interface ItemSelectorFieldProps {
  itemList: NormalizedItem;
  name: string;
  loadingItems?: boolean;
  recommended?: string;
  label?: string;
  autoSelect?: boolean;
  onSelect?: (name: string) => void;
  showIfSingle?: boolean;
  showFilter?: boolean;
  showCount?: boolean;
  emptyStateMessage?: string;
}

const ItemSelectorField: React.FC<ItemSelectorFieldProps> = ({
  itemList,
  name,
  loadingItems,
  recommended,
  onSelect,
  label,
  autoSelect,
  showIfSingle = false,
  showFilter = false,
  showCount = false,
  emptyStateMessage,
}) => {
  const { t } = useTranslation();
  const [selected, { error: selectedError, touched: selectedTouched }] = useField(name);
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const [filteredList, setFilteredList] = React.useState(itemList);
  const [filterText, setFilterText] = React.useState('');
  const itemCount = _.keys(filteredList).length;

  const handleItemChange = React.useCallback(
    (item: string) => {
      setFieldValue(name, item);
      setFieldTouched(name, true);
      validateForm();
      onSelect && onSelect(item);
    },
    [name, setFieldValue, setFieldTouched, validateForm, onSelect],
  );

  React.useEffect(() => {
    if (!selected.value && _.keys(itemList).length === 1) {
      const image = _.find(filteredList);
      handleItemChange(image.name);
    }
    if (!selected.value && recommended) {
      handleItemChange(recommended);
      setFieldTouched(name, false);
    }
    if (!selected.value && autoSelect && !_.isEmpty(filteredList)) {
      const image = _.get(_.keys(filteredList), 0);
      handleItemChange(filteredList[image]?.name);
    }
  }, [
    autoSelect,
    itemList,
    filteredList,
    handleItemChange,
    selected.value,
    recommended,
    name,
    setFieldTouched,
  ]);

  const filterSources = React.useCallback(
    (text: string) => {
      const subList = _.pickBy(itemList, (val) =>
        fuzzy(text.toLowerCase(), val.title.toLowerCase()),
      );
      if (selected.value) {
        subList[selected.value] = itemList[selected.value];
      }
      setFilteredList(subList);
    },
    [itemList, selected.value],
  );

  const debounceFilterText = useDebounceCallback<(text: string) => void>(filterSources);

  const handleFilterChange = (_event, text: string) => {
    setFilterText(text);
    debounceFilterText(text);
  };

  const handleClearFilter = () => {
    setFilterText('');
    filterSources('');
  };

  if (!showIfSingle && itemCount === 1) {
    return null;
  }

  const fieldId = getFieldId(name, 'itemselector');
  const isValid = !(selectedTouched && selectedError);
  const errorMessage = !isValid ? selectedError : '';

  return (
    <FormGroup fieldId={fieldId} label={label} isRequired>
      {loadingItems ? (
        <LoadingInline />
      ) : (
        <>
          {showFilter && (
            <div className="odc-item-selector-filter">
              <TextInput
                className="odc-item-selector-filter__input"
                onChange={handleFilterChange}
                value={filterText}
                placeholder={t('console-shared~Filter by type...')}
                aria-label={t('console-shared~Filter by type')}
              />
              {showCount && (
                <span className="odc-item-selector-filter__count">
                  {t('console-shared~{{count}} item', { count: itemCount })}
                </span>
              )}
            </div>
          )}
          {showFilter && itemCount === 0 ? (
            <EmptyState
              headingLevel="h2"
              titleText={<>{t('console-shared~No results match the filter criteria')}</>}
            >
              <EmptyStateFooter>
                {emptyStateMessage && <EmptyStateBody>{emptyStateMessage}</EmptyStateBody>}
                <EmptyStateActions>
                  <Button variant="link" onClick={handleClearFilter}>
                    {t('console-shared~Clear filter')}
                  </Button>
                </EmptyStateActions>
              </EmptyStateFooter>
            </EmptyState>
          ) : (
            <div
              id="item-selector-field"
              className={`odc-item-selector-field ${
                showFilter ? 'odc-item-selector-field__scrollbar' : ''
              }`}
            >
              {_.values(filteredList).map((item) => (
                <SelectorCard
                  key={item.name}
                  title={item.title}
                  iconUrl={item.iconUrl}
                  name={item.name}
                  selected={selected.value === item.name}
                  recommended={recommended === item.name}
                  onChange={handleItemChange}
                />
              ))}
            </div>
          )}
        </>
      )}

      {!isValid && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem variant="error" icon={<RedExclamationCircleIcon />}>
              {errorMessage}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}
    </FormGroup>
  );
};

export default ItemSelectorField;
