import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { TechPreviewBadge } from '@console/shared';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';

import './PipelineBuilderHeader.scss';

const PipelineBuilderHeader: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation();
  const badge = usePipelineTechPreviewBadge(namespace);

  return (
    <div className="odc-pipeline-builder-header">
      <Flex className="odc-pipeline-builder-header__content">
        <FlexItem grow={{ default: 'grow' }}>
          <h1 className="odc-pipeline-builder-header__title">
            {t('pipelines-plugin~Pipeline builder')}
          </h1>
        </FlexItem>
        {badge && (
          <FlexItem>
            <TechPreviewBadge />
          </FlexItem>
        )}
      </Flex>
    </div>
  );
};

export default PipelineBuilderHeader;
