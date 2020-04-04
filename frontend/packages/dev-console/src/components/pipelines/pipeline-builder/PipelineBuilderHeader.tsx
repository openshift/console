import * as React from 'react';
import { Button, Flex, FlexItem, FlexItemModifiers } from '@patternfly/react-core';
import { warnYAML } from './modals';
import { DevPreviewBadge } from '@console/shared';
import { Pipeline } from '../../../utils/pipeline-augment';
import { goToYAML } from './utils';

import './PipelineBuilderHeader.scss';

type PipelineBuilderHeaderProps = {
  existingPipeline: Pipeline;
  formIsDirty: boolean;
  namespace: string;
};

const PipelineBuilderHeader: React.FC<PipelineBuilderHeaderProps> = (props) => {
  const { existingPipeline, formIsDirty, namespace } = props;

  return (
    <div className="odc-pipeline-builder-header">
      <Flex className="odc-pipeline-builder-header__content">
        <FlexItem breakpointMods={[{ modifier: FlexItemModifiers.grow }]}>
          <h1 className="odc-pipeline-builder-header__title">Pipeline Builder</h1>
        </FlexItem>
        <FlexItem>
          <Button
            variant="link"
            onClick={() => {
              if (formIsDirty) {
                warnYAML(() => goToYAML(existingPipeline, namespace));
              } else {
                goToYAML(existingPipeline, namespace);
              }
            }}
          >
            Edit YAML
          </Button>
        </FlexItem>
        <FlexItem>
          <DevPreviewBadge />
        </FlexItem>
      </Flex>
      <hr />
    </div>
  );
};

export default PipelineBuilderHeader;
