import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { ResourceIcon, ResourceLink } from '@console/internal/components/utils';
import { K8sKind, referenceForModel } from '@console/internal/module/k8s';
import * as models from '../../../models';

import './PipelineResourceRef.scss';

const MODEL_KINDS = Object.values(models).reduce(
  (acc, model: K8sKind) => ({
    ...acc,
    [`${model.kind}-${model.apiVersion}`]: model,
    [model.kind]: model,
  }),
  {},
);

type PipelineResourceRefProps = {
  resourceKind: string;
  resourceName: string;
  disableLink?: boolean;
  displayName?: string;
  largeIcon?: boolean;
  namespace?: string;
  resourceApiVersion?: string;
};

const PipelineResourceRef: React.FC<PipelineResourceRefProps> = ({
  disableLink,
  displayName,
  largeIcon,
  namespace,
  resourceKind,
  resourceName,
  resourceApiVersion,
}) => {
  const modelKey = resourceApiVersion ? `${resourceKind}-${resourceApiVersion}` : resourceKind;
  const model: K8sKind | undefined = MODEL_KINDS[modelKey] || MODEL_KINDS[resourceKind];
  let kind = resourceKind;
  if (model) {
    kind = referenceForModel(model);
  }

  const classNames = css('opp-pipeline-resource-ref', {
    'co-m-resource-icon--lg': largeIcon,
    'opp-pipeline-resource-ref--pipeline-color': !model,
  });

  if (disableLink || !model) {
    return (
      <>
        <ResourceIcon className={classNames} kind={kind} />
        {displayName || resourceName}
      </>
    );
  }

  return (
    <ResourceLink
      className={classNames}
      dataTest="pipeline-resource-ref"
      kind={kind}
      name={resourceName}
      displayName={displayName || resourceName}
      title={resourceName}
      namespace={namespace}
    />
  );
};

export default PipelineResourceRef;
