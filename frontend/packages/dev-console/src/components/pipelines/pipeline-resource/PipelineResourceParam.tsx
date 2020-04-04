import * as React from 'react';
import PipelineGitOptions from './PipelineGitOptions';
import PipelineImageOptions from './PipelineImageOptions';
import PipelineClusterOptions from './PipelineClusterOptions';
import PipelineStorageOptions from './PipelineStorageOptions';

import './PipelineResourceParam.scss';

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

  return <div className="odc-pipeline-resource-param">{renderTypeFields()}</div>;
};

export default PipelineResourceParam;
