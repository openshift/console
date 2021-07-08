import * as React from 'react';
import { Button, FormSelect, FormSelectOption, GridItem, TextInput } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { TaintEffect } from '@console/internal/module/k8s';
import { TOLERATIONS_EFFECTS } from '../shared/consts';
import { TolerationLabel } from './types';

export const TolerationRow = ({ label, onChange, onDelete }: TolerationRowProps) => {
  const { id, key, value, effect } = label;
  const { t } = useTranslation();
  return (
    <>
      <GridItem span={4}>
        <TextInput
          id={`toleration-${id}-key-input`}
          className="kv-label__key"
          placeholder={t('kubevirt-plugin~taint key')}
          isRequired
          type="text"
          value={key}
          onChange={(newKey) => onChange({ ...label, key: newKey })}
          aria-label={t('kubevirt-plugin~selector key')}
        />
      </GridItem>
      <GridItem span={4}>
        <TextInput
          id={`toleration-${id}-value-input`}
          className="kv-label__value"
          placeholder={t('kubevirt-plugin~taint value')}
          isRequired
          type="text"
          value={value}
          onChange={(newValue) => onChange({ ...label, value: newValue })}
          aria-label={t('kubevirt-plugin~selector value')}
        />
      </GridItem>
      <GridItem span={3}>
        <FormSelect
          id={`toleration-${id}-effect-select`}
          className="kv-label__effect"
          isRequired
          value={effect}
          onChange={(v) => onChange({ ...label, effect: v as TaintEffect })}
          aria-label={t('kubevirt-plugin~selector effect')}
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
