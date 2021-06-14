import * as React from 'react';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { PipelineResourceType } from '../const';
import PipelineClusterOptions from './PipelineClusterOptions';
import PipelineGitOptions from './PipelineGitOptions';
import PipelineImageOptions from './PipelineImageOptions';
import PipelineStorageOptions from './PipelineStorageOptions';

export interface PipelineResourceParamProps {
  name: string;
  type: string;
}

const PipelineResourceParam: React.FC<PipelineResourceParamProps> = (props) => {
  const { name, type } = props;

  const renderTypeFields = () => {
    switch (type) {
      case PipelineResourceType.git:
        return <PipelineGitOptions prefixName={name} />;
      case PipelineResourceType.image:
        return <PipelineImageOptions prefixName={name} />;
      case PipelineResourceType.cluster:
        return <PipelineClusterOptions prefixName={name} />;
      case PipelineResourceType.storage:
        return <PipelineStorageOptions prefixName={name} />;
      default:
        return null;
    }
  };

  return <FormSection fullWidth>{renderTypeFields()}</FormSection>;
};

export default PipelineResourceParam;
