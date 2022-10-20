import * as React from 'react';
import { ClusterConfigurationFieldType } from '@console/dynamic-plugin-sdk/src';
import ClusterConfigurationCustomField from './ClusterConfigurationCustomField';
import { ResolvedClusterConfigurationItem } from './types';

const componentForFieldType = {
  // WIP:
  // [ClusterConfigurationFieldType.text]: ClusterConfigurationTextField,
  // [ClusterConfigurationFieldType.checkbox]: ClusterConfigurationCheckboxField,
  // [ClusterConfigurationFieldType.dropdown]: ClusterConfigurationDropdownField,
  [ClusterConfigurationFieldType.custom]: ClusterConfigurationCustomField,
};

const ClusterConfigurationField: React.FC<{ item: ResolvedClusterConfigurationItem }> = ({
  item,
}) => {
  const Field = componentForFieldType[item.field.type];
  return Field ? <Field item={item} field={item.field} /> : null;
};

export default ClusterConfigurationField;
