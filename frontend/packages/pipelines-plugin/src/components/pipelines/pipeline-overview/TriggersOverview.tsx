import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import { TriggerTemplateModel } from '../../../models';
import { PipelineKind } from '../../../types';
import { usePipelineTriggerTemplateNames } from '../utils/triggers';
import TriggerResourceLinks from './TriggerResourceLinks';

type TriggersOverviewProps = {
  pipeline: PipelineKind;
};

const TriggersOverview: React.FC<TriggersOverviewProps> = ({ pipeline }) => {
  const {
    metadata: { name, namespace },
  } = pipeline;
  const { t } = useTranslation();
  const templateNames = usePipelineTriggerTemplateNames(name, namespace) || [];

  return templateNames.length > 0 ? (
    <>
      <SidebarSectionHeading data-test="triggers-heading" text={t('pipelines-plugin~Triggers')} />
      <ul className="list-group" data-test="triggers-list">
        <li className="list-group-item pipeline-overview" data-test="triggers-list-item">
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
            <FlexItem>
              <TriggerResourceLinks
                namespace={namespace}
                model={TriggerTemplateModel}
                links={templateNames}
              />
            </FlexItem>
          </Flex>
        </li>
      </ul>
    </>
  ) : null;
};

export default TriggersOverview;
