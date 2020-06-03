import * as React from 'react';
import * as _ from 'lodash';
import { useField, useFormikContext, FormikValues } from 'formik';
import { LoadingInline } from '@console/internal/components/utils';
import { FormGroup } from '@patternfly/react-core';
import { getFieldId } from '@console/shared';
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
}

const ItemSelectorField: React.FC<ItemSelectorFieldProps> = ({
  itemList,
  name,
  loadingItems,
  recommended,
  onSelect,
  label,
  autoSelect,
}) => {
  const [selected, { error: selectedError, touched: selectedTouched }] = useField(name);
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const itemCount = _.keys(itemList).length;

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
    if (!selected.value && itemCount === 1) {
      const image = _.find(itemList);
      handleItemChange(image.name);
    }
    if (!selected.value && recommended) {
      handleItemChange(recommended);
      setFieldTouched(name, false);
    }
    if (!selected.value && autoSelect && !_.isEmpty(itemList)) {
      const image = _.get(_.keys(itemList), 0);
      handleItemChange(itemList[image]?.name);
    }
  }, [
    autoSelect,
    itemCount,
    itemList,
    handleItemChange,
    selected.value,
    recommended,
    name,
    setFieldTouched,
  ]);

  if (itemCount === 1) {
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
        <div id="item-selector-field" className="odc-item-selector-field">
          {_.values(itemList).map((item) => (
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
    </FormGroup>
  );
};

export default ItemSelectorField;
