import * as React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { warnYAML } from './modals';
import { TechPreviewBadge } from '@console/shared';
import { Pipeline } from '../../../utils/pipeline-augment';
import { goToYAML } from './utils';

import './PipelineBuilderHeader.scss';

type PipelineBuilderHeaderProps = {
  existingPipeline: Pipeline;
  namespace: string;
};

const PipelineBuilderHeader: React.FC<PipelineBuilderHeaderProps> = (props) => {
  const { existingPipeline, namespace } = props;

  return (
    <div className="odc-pipeline-builder-header">
      <Flex className="odc-pipeline-builder-header__content">
        <FlexItem grow={{"default":"grow"}} >
          <h1 className="odc-pipeline-builder-header__title">Pipeline Builder</h1>
        </FlexItem>
        <FlexItem>
          <Button
            variant="link"
            onClick={() => {
              warnYAML(() => goToYAML(existingPipeline, namespace));
            }}
          >
            Edit YAML
          </Button>
        </FlexItem>
        <FlexItem>
          <TechPreviewBadge />
        </FlexItem>
      </Flex>
      <hr />
    </div>
  );
};

export default PipelineBuilderHeader;
