import * as React from 'react';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { GridItem, TextInput, Button } from '@patternfly/react-core';
import { IDLabel } from '../types';

export const LabelRow = <T extends IDLabel = IDLabel>({
  label,
  onChange,
  onDelete,
}: LabelRowProps<T>) => {
  const { id, key, value } = label;
  return (
    <>
      <GridItem span={6}>
        <TextInput
          id={`label-${id}-key-input`}
          className="kv-label__key"
          placeholder="key"
          isRequired
          type="text"
          value={key}
          onChange={(newKey) => onChange({ ...label, key: newKey })}
          aria-label="selector key"
        />
      </GridItem>
      <GridItem span={5}>
        <TextInput
          id={`label-${id}-value-input`}
          className="kv-label__value"
          placeholder="value"
          isRequired
          type="text"
          value={value}
          onChange={(newValue) => onChange({ ...label, value: newValue })}
          aria-label="selector value"
        />
      </GridItem>
      <GridItem span={1}>
        <Button id={`label-${id}-delete-btn`} onClick={() => onDelete(id)} variant="plain">
          <MinusCircleIcon />
        </Button>
      </GridItem>
    </>
  );
};

type LabelRowProps<T> = {
  label: T;
  onChange: (label: T) => void;
  onDelete: (id: any) => void;
};
