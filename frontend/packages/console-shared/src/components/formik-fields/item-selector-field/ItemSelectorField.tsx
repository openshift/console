import * as React from 'react';
import * as _ from 'lodash';
import { useField, useFormikContext, FormikValues } from 'formik';
import { LoadingInline } from '@console/internal/components/utils';
import { FormGroup, Alert } from '@patternfly/react-core';
import { StarIcon } from '@patternfly/react-icons';
import { getFieldId } from '@console/shared';
import SelectorCard from './SelectorCard';
import './ItemSelectorField.scss';

interface Item {
  name: string;
  title: string;
  displayName: string;
  iconUrl?: string;
  [x: string]: any;
}

interface NormalizedItem {
  [item: string]: Item;
}

interface ItemSelectorFieldProps {
  itemList: NormalizedItem;
  name: string;
  label?: string;
  loadingItems?: boolean;
  isRecommending?: boolean;
  recommended?: string;
  couldNotRecommend?: boolean;
  onSelect?: (name: string) => void;
}

const ItemSelectorField: React.FC<ItemSelectorFieldProps> = ({
  itemList,
  name,
  label,
  loadingItems,
  isRecommending,
  recommended,
  couldNotRecommend,
  onSelect,
}) => {
  const [selected, { error: selectedError, touched: selectedTouched }] = useField(name);
  const { setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const itemCount = _.keys(itemList).length;

  const handleItemChange = React.useCallback(
    (image: string) => {
      setFieldValue(name, image);
      setFieldTouched(name, true);
      validateForm();
    },
    [name, setFieldValue, setFieldTouched, validateForm],
  );

  React.useEffect(() => {
    if (!selected.value && itemCount === 1) {
      const image = _.find(itemList);
      handleItemChange(image.name);
    }
    if (!selected.value && recommended) {
      handleItemChange(recommended);
    }
  }, [itemCount, itemList, handleItemChange, selected.value, recommended]);

  if (itemCount === 1) {
    return null;
  }

  const fieldId = getFieldId(name, 'selector');
  const isValid = !(selectedTouched && selectedError);
  const errorMessage = !isValid ? selectedError : '';

  return (
    <FormGroup
      fieldId={fieldId}
      label={label}
      helperTextInvalid={errorMessage}
      isValid={isValid}
      isRequired
    >
      {isRecommending && (
        <>
          <LoadingInline /> Detecting recommended {label}...
        </>
      )}
      {recommended && (
        <>
          <Alert variant="success" title="Builder image(s) detected." isInline>
            Recommended {label} are represented by{' '}
            <StarIcon style={{ color: 'var(--pf-global--primary-color--100)' }} /> icon.
          </Alert>
          <br />
        </>
      )}
      {couldNotRecommend && (
        <>
          <Alert variant="warning" title="Unable to detect the builder image." isInline>
            Select the most appropriate one from the list to continue.
          </Alert>
          <br />
        </>
      )}
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
              onChange={onSelect || handleItemChange}
            />
          ))}
        </div>
      )}
    </FormGroup>
  );
};

export default ItemSelectorField;
