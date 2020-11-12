import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { TechPreviewBadge } from '@console/shared';

import './PipelineBuilderHeader.scss';

const PipelineBuilderHeader: React.FC = () => (
  <div className="odc-pipeline-builder-header">
    <Flex className="odc-pipeline-builder-header__content">
      <FlexItem grow={{ default: 'grow' }}>
        <h1 className="odc-pipeline-builder-header__title">Pipeline Builder</h1>
      </FlexItem>
      <FlexItem>
        <TechPreviewBadge />
      </FlexItem>
    </Flex>
  </div>
);

export default PipelineBuilderHeader;
