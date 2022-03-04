import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroupField } from '@console/shared';
import { sourceSinkType } from '../../import-types';
import SourceResources, { SourceResourcesProps } from './SourceResources';
import SourceUri from './SourceUri';

const SourceUriResourcesGroup: React.FC<SourceResourcesProps> = ({ namespace, isMoveSink }) => {
  const { t } = useTranslation();
  return (
    <RadioGroupField
      name="formData.sourceType"
      options={[
        {
          label: sourceSinkType(t).Resource.label,
          value: sourceSinkType(t).Resource.value,
          activeChildren: <SourceResources namespace={namespace} isMoveSink={isMoveSink} />,
        },
        {
          label: sourceSinkType(t).Uri.label,
          value: sourceSinkType(t).Uri.value,
          activeChildren: <SourceUri />,
        },
      ]}
    />
  );
};

export default SourceUriResourcesGroup;
