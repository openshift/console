import * as React from 'react';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { EventListenerModel } from '../../../models';
import { PipelineRun } from '../../../utils/pipeline-augment';
import { StartedByAnnotation, StartedByLabel } from '../../pipelines/const';

type TriggeredByProps = {
  pipelineRun: PipelineRun;
};

const TriggeredBySection: React.FC<TriggeredByProps> = (props) => {
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
    <dl>
      <dt>Triggered by:</dt>
      <dd>{value}</dd>
    </dl>
  );
};

export default TriggeredBySection;
