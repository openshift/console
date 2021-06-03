import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TextInputTypes } from '@patternfly/react-core';
import {
  MultiColumnField,
  InputField,
  FormSelectField,
  FormSelectFieldOption,
} from '@console/shared';
import { PipelineResourceType } from '../const';

type PipelineResourcesParam = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineResources: React.FC<PipelineResourcesParam> = (props) => {
  const { t } = useTranslation();
  const {
    addLabel = t('pipelines-plugin~Add Pipeline resource'),
    fieldName,
    isReadOnly = false,
  } = props;
  const emptyMessage = t('pipelines-plugin~No resources are associated with this pipeline.');
  const pipelineResourceTypeSelections: FormSelectFieldOption<PipelineResourceType | ''>[] = [
    {
      value: '',
      label: t('pipelines-plugin~Select resource type'),
      isDisabled: true,
      isPlaceholder: true,
    },
    { value: PipelineResourceType.git, label: 'Git' },
    { value: PipelineResourceType.image, label: 'Image' },
    { value: PipelineResourceType.cluster, label: 'Cluster' },
    { value: PipelineResourceType.storage, label: 'Storage' },
  ];

  return (
    <div className="co-m-pane__form">
      <MultiColumnField
        data-test="pipeline-resources"
        name={fieldName}
        addLabel={addLabel}
        headers={[t('pipelines-plugin~Name'), t('pipelines-plugin~Resource type')]}
        emptyValues={{ name: '', type: '' }}
        emptyMessage={emptyMessage}
        isReadOnly={isReadOnly}
      >
        <InputField
          name="name"
          type={TextInputTypes.text}
          placeholder={t('pipelines-plugin~Name')}
          isReadOnly={isReadOnly}
        />
        <FormSelectField
          name="type"
          options={pipelineResourceTypeSelections}
          isDisabled={isReadOnly}
        />
      </MultiColumnField>
    </div>
  );
};

export default PipelineResources;
