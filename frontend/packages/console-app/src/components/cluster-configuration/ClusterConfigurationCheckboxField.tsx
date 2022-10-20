import * as React from 'react';
import { FormGroup, Checkbox } from '@patternfly/react-core';
import { ClusterConfigurationCheckboxField } from '@console/dynamic-plugin-sdk/src';
import { FormLayout } from '@console/shared/src/components/cluster-configuration';
import { ResolvedClusterConfigurationItem } from './types';

type ClusterConfigurationCheckboxFieldProps = {
  item: ResolvedClusterConfigurationItem;
  field: ClusterConfigurationCheckboxField;
};

const ClusterConfigurationCheckboxField: React.FC<ClusterConfigurationCheckboxFieldProps> = ({
  item,
  // field,
}) => {
  const handleOnChange = (checked: boolean) => {
    // eslint-disable-next-line no-console
    console.log('xxx onChange', checked);
  };
  return (
    <FormGroup
      fieldId={item.id}
      label={item.label}
      helperText={item.description}
      data-test={`${item.id} field`}
    >
      <FormLayout>
        <Checkbox id="" title="asd" onChange={handleOnChange} />
      </FormLayout>
    </FormGroup>
  );
};

export default ClusterConfigurationCheckboxField;
