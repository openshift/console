import * as _ from 'lodash';
import * as React from 'react';
import { Conditions } from '@console/internal/components/conditions';
import { useCalculatedDescriptorProperties } from '../utils';
import { DescriptorType, StatusDescriptor } from '../types';
import { SectionHeading } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { JSONSchema6 } from 'json-schema';

// Determines if the descriptor points to an array value.
const validateConditionsDescriptor = (descriptor: StatusDescriptor, value: any): boolean => {
  if (!_.isArray(value)) {
    // eslint-disable-next-line no-console
    console.warn(
      `[Invalid x-descriptor] 'urn:alm:descriptor:io.kubernetes.conditions' is incompatible with ${descriptor.path} and will have no effect`,
      descriptor,
    );
    return false;
  }
  return true;
};

export const DescriptorConditions: React.FC<ConditionsDescriptorProps> = ({
  descriptor,
  obj,
  schema,
}) => {
  const { displayName, value } = useCalculatedDescriptorProperties(
    DescriptorType.status,
    descriptor,
    schema,
    obj,
  );

  if (!validateConditionsDescriptor(descriptor, value)) {
    return null;
  }

  return (
    <div className="co-m-pane__body">
      <SectionHeading text={displayName} />
      <Conditions conditions={value} />
    </div>
  );
};
DescriptorConditions.displayName = 'DescriptorConditions';

type ConditionsDescriptorProps = {
  descriptor: StatusDescriptor;
  obj: K8sResourceKind;
  schema: JSONSchema6;
};
