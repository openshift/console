import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { TechPreviewBadge } from '@console/shared';

import './PipelineBuilderHeader.scss';
import { useTranslation } from 'react-i18next';

const PipelineBuilderHeader: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="odc-pipeline-builder-header">
      <Flex className="odc-pipeline-builder-header__content">
        <FlexItem grow={{ default: 'grow' }}>
          <h1 className="odc-pipeline-builder-header__title">
            {t('pipelines-plugin~Pipeline Builder')}
          </h1>
        </FlexItem>
        <FlexItem>
          <TechPreviewBadge />
        </FlexItem>
      </Flex>
    </div>
  );
};

export default PipelineBuilderHeader;
