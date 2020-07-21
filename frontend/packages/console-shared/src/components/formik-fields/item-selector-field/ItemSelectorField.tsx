import * as React from 'react';
import * as _ from 'lodash';
import * as fuzzy from 'fuzzysearch';
import { useField, useFormikContext, FormikValues } from 'formik';
import { LoadingInline } from '@console/internal/components/utils';
import {
  FormGroup,
  EmptyState,
  Title,
  EmptyStatePrimary,
  Button,
  TextInput,
  EmptyStateBody,
  pluralize,
} from '@patternfly/react-core';
import { getFieldId, useDebounceCallback } from '@console/shared';
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
}) => {
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

  const debounceFilterText = useDebounceCallback<(text: string) => void>(filterSources, [
    filterSources,
  ]);

  const handleFilterChange = (text: string) => {
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
    <FormGroup
      fieldId={fieldId}
      helperTextInvalid={errorMessage}
      validated={isValid ? 'default' : 'error'}
      label={label}
      isRequired
    >
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
                placeholder="Filter by type..."
                aria-label="Filter by type"
              />
              {showCount && (
                <span className="odc-item-selector-filter__count">
                  {pluralize(itemCount, 'item')}
                </span>
              )}
            </div>
          )}
          {showFilter && itemCount === 0 ? (
            <EmptyState>
              <Title headingLevel="h2" size="lg">
                No results match the filter criteria
              </Title>
              <EmptyStateBody>
                No Event Source types are being shown due to the filters being applied.
              </EmptyStateBody>
              <EmptyStatePrimary>
                <Button variant="link" onClick={handleClearFilter}>
                  Clear filter
                </Button>
              </EmptyStatePrimary>
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
                  displayName={item.displayName}
                  selected={selected.value === item.name}
                  recommended={recommended === item.name}
                  onChange={handleItemChange}
                />
              ))}
            </div>
          )}
        </>
      )}
    </FormGroup>
  );
};

export default ItemSelectorField;
