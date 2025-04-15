import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventListenerModel } from '../../../models';
import { PipelineRunKind } from '../../../types';
import { StartedByAnnotation, StartedByLabel } from '../../pipelines/const';

type TriggeredByProps = {
  pipelineRun: PipelineRunKind;
};

const TriggeredBySection: React.FC<TriggeredByProps> = (props) => {
  const { t } = useTranslation();
  const {
    pipelineRun: {
      metadata: { annotations, namespace, labels },
    },
  } = props;

  const manualTrigger = annotations?.[StartedByAnnotation.user];
  const autoTrigger = labels?.[StartedByLabel.triggers];

  if (!manualTrigger && !autoTrigger) {
    return null;
  }

  let value = null;
  if (manualTrigger) {
    value = manualTrigger;
  } else if (autoTrigger) {
    value = (
      <ResourceLink
        kind={referenceForModel(EventListenerModel)}
        name={autoTrigger}
        namespace={namespace}
      />
    );
  } else {
    return null;
  }

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('pipelines-plugin~Triggered by')}:</DescriptionListTerm>
        <DescriptionListDescription>{value}</DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default TriggeredBySection;
