import * as React from 'react';
import { Button, Flex, FlexItem, FlexItemModifiers } from '@patternfly/react-core';
import { warnYAML } from './modals';
import { Pipeline } from '../../../utils/pipeline-augment';
import { goToYAML } from './utils';
import { useTranslation } from 'react-i18next';

import './PipelineBuilderHeader.scss';

type PipelineBuilderHeaderProps = {
  existingPipeline: Pipeline;
  namespace: string;
};

const PipelineBuilderHeader: React.FC<PipelineBuilderHeaderProps> = (props) => {
  const { existingPipeline, namespace } = props;
  const { t } = useTranslation();
  return (
    <div className="odc-pipeline-builder-header">
      <Flex className="odc-pipeline-builder-header__content pf-m-column">
      <Flex>
        <FlexItem breakpointMods={[{ modifier: FlexItemModifiers.grow }]}>
          <h1 className="odc-pipeline-builder-header__title">Create Pipeline</h1>
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
      </Flex>
      <p className="help-block">
        {t('Description')}
      </p>
      </Flex>
      <hr />
    </div>
  );
};

export default PipelineBuilderHeader;
