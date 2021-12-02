import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroupField } from '@console/shared';
import { sourceSinkType } from '../../import-types';
import SinkResources, { SinkResourcesProps } from './SinkResources';
import SinkUri from './SinkUri';

const SinkUriResourcesGroup: React.FC<SinkResourcesProps> = ({ namespace, isMoveSink }) => {
  const { t } = useTranslation();
  return (
    <RadioGroupField
      name="formData.sinkType"
      options={[
        {
          label: sourceSinkType(t).Resource.label,
          value: sourceSinkType(t).Resource.value,
          activeChildren: <SinkResources namespace={namespace} isMoveSink={isMoveSink} />,
        },
        {
          label: sourceSinkType(t).Uri.label,
          value: sourceSinkType(t).Uri.value,
          activeChildren: <SinkUri />,
        },
      ]}
    />
  );
};

export default SinkUriResourcesGroup;
