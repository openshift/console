import * as React from 'react';
import { useFormikContext } from 'formik';
import { referenceForModel } from '@console/internal/module/k8s';
import { Firehose } from '@console/internal/components/utils';
import { ClusterTriggerBindingModel, TriggerBindingModel } from '../../../../models';
import { TriggerBindingKind } from '../../resource-types';
import TriggerBindingSelectorDropdown from './TriggerBindingSelectorDropdown';
import { AddTriggerFormValues } from './types';

type TriggerBindingSelectorProps = {
  description?: string;
  label?: string;
  onChange: (selectedTriggerBinding: TriggerBindingKind) => void;
};

const TriggerBindingSelector: React.FC<TriggerBindingSelectorProps> = (props) => {
  const { description, label = TriggerBindingModel.label, onChange } = props;
  const { values } = useFormikContext<AddTriggerFormValues>();

  return (
    <Firehose
      resources={[
        {
          isList: true,
          namespace: values.namespace,
          kind: referenceForModel(TriggerBindingModel),
          prop: 'triggerBindingData',
          isOptional: true,
        },
        {
          isList: true,
          kind: referenceForModel(ClusterTriggerBindingModel),
          prop: 'clusterTriggerBindingData',
          isOptional: true,
        },
      ]}
    >
      <TriggerBindingSelectorDropdown description={description} label={label} onChange={onChange} />
    </Firehose>
  );
};

export default TriggerBindingSelector;
