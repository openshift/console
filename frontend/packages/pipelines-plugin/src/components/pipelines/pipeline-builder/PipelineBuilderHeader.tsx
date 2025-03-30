import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { TechPreviewBadge } from '@console/shared';
import PrimaryHeading from '@console/shared/src/components/heading/PrimaryHeading';
import NavTitle from '@console/shared/src/components/layout/NavTitle';
import { usePipelineTechPreviewBadge } from '../../../utils/hooks';

import './PipelineBuilderHeader.scss';

const PipelineBuilderHeader: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { t } = useTranslation();
  const badge = usePipelineTechPreviewBadge(namespace);

  return (
    <div className="odc-pipeline-builder-header">
      <Flex className="odc-pipeline-builder-header__content">
        <FlexItem grow={{ default: 'grow' }}>
          <NavTitle>
            <PrimaryHeading className="odc-pipeline-builder-header__title">
              {t('pipelines-plugin~Pipeline builder')}
            </PrimaryHeading>
          </NavTitle>
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
