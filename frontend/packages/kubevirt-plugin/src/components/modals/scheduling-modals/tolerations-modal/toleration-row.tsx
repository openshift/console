import * as React from 'react';
import { TaintEffect } from '@console/internal/module/k8s';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { GridItem, TextInput, Button, FormSelect, FormSelectOption } from '@patternfly/react-core';
import { TOLERATIONS_EFFECTS } from '../shared/consts';
import { TolerationLabel } from './types';

export const TolerationRow = ({ label, onChange, onDelete }: TolerationRowProps) => {
  const { id, key, value, effect } = label;
  return (
    <>
      <GridItem span={4}>
        <TextInput
          id={`toleration-${id}-key-input`}
          className="kv-label__key"
          placeholder="taint key"
          isRequired
          type="text"
          value={key}
          onChange={(newKey) => onChange({ ...label, key: newKey })}
          aria-label="selector key"
        />
      </GridItem>
      <GridItem span={4}>
        <TextInput
          id={`toleration-${id}-value-input`}
          className="kv-label__value"
          placeholder="taint value"
          isRequired
          type="text"
          value={value}
          onChange={(newValue) => onChange({ ...label, value: newValue })}
          aria-label="selector value"
        />
      </GridItem>
      <GridItem span={3}>
        <FormSelect
          id={`toleration-${id}-effect-select`}
          className="kv-label__effect"
          isRequired
          value={effect}
          onChange={(v) => onChange({ ...label, effect: v as TaintEffect })}
          aria-label="selector effect"
        >
          {TOLERATIONS_EFFECTS.map((effectOption) => (
            <FormSelectOption key={effectOption} value={effectOption} label={effectOption} />
          ))}
        </FormSelect>
      </GridItem>
      <GridItem span={1}>
        <Button id={`toleration-${id}-delete-btn`} onClick={() => onDelete(id)} variant="plain">
          <MinusCircleIcon />
        </Button>
      </GridItem>
    </>
  );
};

type TolerationRowProps = {
  label: TolerationLabel;
  onChange: (label: TolerationLabel) => void;
  onDelete: (id: any) => void;
};
