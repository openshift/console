import * as React from 'react';
import {
  FormGroup,
  Checkbox,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { ClusterConfigurationCheckboxField } from '@console/dynamic-plugin-sdk/src';
import { FormLayout } from '@console/shared/src/components/cluster-configuration';
import { ResolvedClusterConfigurationItem } from './types';

type ClusterConfigurationCheckboxFieldProps = {
  item: ResolvedClusterConfigurationItem;
  field: ClusterConfigurationCheckboxField;
};

const ClusterConfigurationCheckboxField: React.FC<ClusterConfigurationCheckboxFieldProps> = ({
  item,
}) => (
  <FormGroup fieldId={item.id} label={item.label} data-test={`${item.id} field`}>
    <FormLayout>
      <Checkbox id="" title="asd" />
    </FormLayout>

    <FormHelperText>
      <HelperText>
        <HelperTextItem>{item.description}</HelperTextItem>
      </HelperText>
    </FormHelperText>
  </FormGroup>
);

export default ClusterConfigurationCheckboxField;
