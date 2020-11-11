import * as React from 'react';
import { useFormikContext } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { ResourceDropdownField } from '@console/shared';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { ClusterTriggerBindingModel, TriggerBindingModel } from '../../../../models';
import { TriggerBindingKind } from '../../resource-types';
import { AddTriggerFormValues } from './types';

type TriggerBindingSelectorProps = {
  description?: string;
  label?: string;
  onChange: (selectedTriggerBinding: TriggerBindingKind) => void;
};

const KEY_DIVIDER = '~';

const TriggerBindingSelector: React.FC<TriggerBindingSelectorProps> = (props) => {
  const { description, label = TriggerBindingModel.label, onChange } = props;
  const { values } = useFormikContext<AddTriggerFormValues>();
  const autoCompleteFilter = (strText: string, item: React.ReactElement): boolean =>
    fuzzy(strText, item?.props?.name);
  const onTriggerChange = (key: string, value: string, selectedResource: TriggerBindingKind) => {
    if (selectedResource) {
      onChange && onChange(selectedResource);
    }
  };

  return (
    <ResourceDropdownField
      name="triggerBinding.name"
      resources={[
        {
          isList: true,
          namespace: values.namespace,
          kind: referenceForModel(TriggerBindingModel),
          prop: 'triggerBindingData',
          optional: true,
        },
        {
          isList: true,
          kind: referenceForModel(ClusterTriggerBindingModel),
          prop: 'clusterTriggerBindingData',
          optional: true,
        },
      ]}
      autocompleteFilter={autoCompleteFilter}
      dataSelector={['metadata', 'name']}
      customResourceKey={(key: string, resource: K8sResourceKind) => {
        const { kind } = resource;
        const order = kind === ClusterTriggerBindingModel.kind ? 2 : 1;
        return `${order}${KEY_DIVIDER}${key}`;
      }}
      fullWidth
      helpText={description}
      label={label}
      placeholder={`Select ${label}`}
      title={`Select ${label}`}
      showBadge
      onChange={onTriggerChange}
    />
  );
};

export default TriggerBindingSelector;
