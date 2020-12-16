import * as React from 'react';
import FormSection from '../../import/section/FormSection';
import PipelineGitOptions from './PipelineGitOptions';
import PipelineImageOptions from './PipelineImageOptions';
import PipelineClusterOptions from './PipelineClusterOptions';
import PipelineStorageOptions from './PipelineStorageOptions';

export interface PipelineResourceParamProps {
  name: string;
  type: string;
}

const PipelineResourceParam: React.FC<PipelineResourceParamProps> = (props) => {
  const { name, type } = props;

  const renderTypeFields = () => {
    switch (type) {
      case 'git':
        return <PipelineGitOptions prefixName={name} />;
      case 'image':
        return <PipelineImageOptions prefixName={name} />;
      case 'cluster':
        return <PipelineClusterOptions prefixName={name} />;
      case 'storage':
        return <PipelineStorageOptions prefixName={name} />;
      default:
        return null;
    }
  };

  return <FormSection fullWidth>{renderTypeFields()}</FormSection>;
};

export default PipelineResourceParam;
