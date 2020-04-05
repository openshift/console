import * as React from 'react';
import { MinusCircleIcon } from '@patternfly/react-icons';
import {
  GridItem,
  TextInput,
  Button,
  FormSelect,
  FormSelectOption,
  Select,
  SelectVariant,
} from '@patternfly/react-core';
import { EXPRESSION_OPERATORS } from '../../../shared/consts';
import { AffinityLabel } from '../../types';
import './affinity-expression-row.scss';

export const AffinityExpressionRow = ({
  expression,
  onChange,
  onDelete,
}: AffinityExpressionRowProps) => {
  const { id, key, values, operator } = expression;
  const enableValueField = operator !== 'Exists' && operator !== 'DoesNotExist';
  const [isValuesExpanded, setIsValuesExpanded] = React.useState(false);

  const onSelect = (event, selection) => {
    const isValueExist = values.some((item) => item === selection);
    if (isValueExist) {
      onChange({ ...expression, values: values.filter((item) => item !== selection) });
    } else {
      onChange({ ...expression, values: [...values, selection] });
    }
  };
  return (
    <>
      <GridItem span={4}>
        <TextInput
          className="kv-affinity-expression-row__key-input"
          placeholder="key"
          isRequired
          type="text"
          value={key}
          onChange={(newKey) => onChange({ ...expression, key: newKey })}
          aria-label="selector key"
        />
      </GridItem>
      <GridItem span={2}>
        <FormSelect
          className="kv-affinity-expression-row__operator-input"
          isRequired
          value={operator}
          onChange={(v) => onChange({ ...expression, operator: v as AffinityLabel['operator'] })}
          aria-label="selector effect"
        >
          {EXPRESSION_OPERATORS.map((operatorOption) => (
            <FormSelectOption key={operatorOption} value={operatorOption} label={operatorOption} />
          ))}
        </FormSelect>
      </GridItem>
      <GridItem span={5}>
        <Select
          isDisabled={!enableValueField}
          variant={SelectVariant.typeaheadMulti}
          isExpanded={isValuesExpanded}
          isCreatable
          ariaLabelTypeAhead="Enter Value"
          onToggle={() => setIsValuesExpanded(!isValuesExpanded)}
          onClear={() => onChange({ ...expression, values: [] })}
          onSelect={onSelect}
          selections={enableValueField ? values : []}
          ariaLabelledBy="values select"
          placeholderText={enableValueField ? 'Enter Value' : ''}
        />
      </GridItem>
      <GridItem span={1}>
        <Button id={`${key}-delete-btn`} onClick={() => onDelete(id)} variant="plain">
          <MinusCircleIcon />
        </Button>
      </GridItem>
    </>
  );
};

type AffinityExpressionRowProps = {
  expression: AffinityLabel;
  onChange: (label: AffinityLabel) => void;
  onDelete: (id: any) => void;
};
