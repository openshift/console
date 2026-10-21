import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroupField } from '@console/shared';
import { sourceSinkType } from '../../import-types';
import type { SinkResourcesProps } from './SinkResources';
import SinkResources from './SinkResources';
import SinkUri from './SinkUri';

const SinkUriResourcesGroup: FC<SinkResourcesProps> = ({ namespace, isMoveSink }) => {
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
