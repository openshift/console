import * as React from 'react';
import { FormGroup, TextInput } from '@patternfly/react-core';
import { ClusterConfigurationTextField } from '@console/dynamic-plugin-sdk/src';
import { FormLayout } from '@console/shared/src/components/cluster-configuration';
import { useDebounceCallback } from './hooks';
import { ResolvedClusterConfigurationItem } from './types';

type ClusterConfigurationTextFieldProps = {
  item: ResolvedClusterConfigurationItem;
  field: ClusterConfigurationTextField;
};

const ClusterConfigurationTextField: React.FC<ClusterConfigurationTextFieldProps> = ({
  item,
  field,
}) => {
  const [value, setValue] = React.useState<string>(field.defaultValue || '');

  const save = useDebounceCallback(() => {
    // eslint-disable-next-line no-console
    console.log('xxx save');

    // k8s patch
  }, 2000);
  const handleOnChange = (newValue: string) => {
    // eslint-disable-next-line no-console
    console.log('xxx onChange', newValue);
    setValue(newValue);
    save();
  };

  return (
    <FormGroup
      fieldId={item.id}
      label={item.label}
      helperText={item.description}
      data-test={`${item.id} field`}
    >
      <FormLayout>
        <TextInput
          id={item.id}
          value={value}
          onChange={handleOnChange}
          isDisabled={item.readonly}
        />
      </FormLayout>
    </FormGroup>
  );
};

export default ClusterConfigurationTextField;
