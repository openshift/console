import * as React from 'react';
import * as _ from 'lodash';
import { Alert, ExpandableSection } from '@patternfly/react-core';
import { DaemonSetModel, PodModel } from '@console/internal/models';
import { ResourceLink } from '@console/internal/components/utils';
import { PodKind } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared';
import {
  NODE_STATUS_STARTING_MAINTENANCE,
  HOST_STATUS_UNKNOWN,
  HOST_HEALTH_ERROR,
  NODE_STATUS_STOPPING_MAINTENANCE,
} from '../../constants';

import './PowerOffStatusValidations.scss';

type StatusValidationProps = {
  status: string;
  nodePods: PodKind[];
  loadError?: any;
  onLinkClicked?: () => void;
};

type ExpandableResourcesProps = {
  resources: {
    name: string;
    namespace: string;
    kind: string;
  }[];
  onLinkClicked?: () => void;
  subject: string;
};

export const getStaticPods = (pods?: PodKind[]) =>
  (
    pods?.filter((pod) => {
      const annotations = pod.metadata?.annotations || {};
      return !!annotations['kubernetes.io/config.mirror'];
    }) || []
  ).map((pod) => ({
    name: getName(pod),
    namespace: getNamespace(pod),
    kind: PodModel.kind,
  }));

export const getDaemonSetsOfPods = (pods?: PodKind[]) => {
  if (!pods) {
    return [];
  }

  const namespaces: { [key: string]: string[] } = {};
  pods.forEach((pod) => {
    const ownerReferences =
      pod.metadata?.ownerReferences?.filter((or) => or.kind === DaemonSetModel.kind) || [];
    ownerReferences.forEach((or) => {
      namespaces[getNamespace(pod)] = namespaces[getNamespace(pod)] || [];
      namespaces[getNamespace(pod)].push(or.name);
    });
  });

  const result = _.flatten(
    Object.getOwnPropertyNames(namespaces).map((ns) =>
      namespaces[ns].map((name) => ({
        name,
        namespace: ns,
        kind: DaemonSetModel.kind,
      })),
    ),
  );
  return result;
};

const ExpandableResources: React.FC<ExpandableResourcesProps> = ({
  resources,
  onLinkClicked,
  subject,
}) => {
  const [isExpanded, setExpanded] = React.useState(false);
  const onToggle = React.useCallback(() => setExpanded(!isExpanded), [isExpanded, setExpanded]);
  const onLinkClick = React.useCallback(
    (event) => {
      onLinkClicked && (!event.key || event.key === 'Enter') && onLinkClicked();
    },
    [onLinkClicked],
  );

  if (!resources || resources.length === 0) {
    return null;
  }

  const toggleText = `${isExpanded ? 'Hide' : 'Show'} ${subject} (${resources.length})`;

  return (
    <ExpandableSection onToggle={onToggle} isExpanded={isExpanded} toggleText={toggleText}>
      {resources
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((resource) => (
          <div
            onClick={onLinkClick}
            onKeyPress={onLinkClick}
            key={`${resource.name}-${resource.namespace}`}
            role="link"
            tabIndex={0}
          >
            <ResourceLink
              kind={resource.kind}
              name={resource.name}
              namespace={resource.namespace}
            />
          </div>
        ))}
    </ExpandableSection>
  );
};

export const StatusValidations: React.FC<StatusValidationProps> = ({
  status,
  nodePods,
  loadError,
  onLinkClicked,
}) => {
  const validations = [];
  const [daemonSets, staticPods] = React.useMemo(
    () => [getDaemonSetsOfPods(nodePods), getStaticPods(nodePods)],
    [nodePods],
  );

  if (loadError) {
    validations.push({
      title: 'Failed to load data.',
      description: 'Failed to load subresources.',
      level: 'danger',
    });
  }

  if ([HOST_STATUS_UNKNOWN, ...HOST_HEALTH_ERROR].includes(status)) {
    validations.push({
      title: 'The bare metal host is not healthy.',
      description: 'The host cannot be powered off gracefully untils its health is restored.',
      level: 'warning',
    });
  }

  if (status === NODE_STATUS_STARTING_MAINTENANCE) {
    validations.push({
      title: 'The node is starting maintenance.',
      description:
        'The node cannot be powered off gracefully until it finishes entering maintenance.',
      level: 'info',
    });
  }

  if (status === NODE_STATUS_STOPPING_MAINTENANCE) {
    validations.push({
      title: 'The node is stopping maintenance.',
      description: 'The node cannot be powered off gracefully while it is exiting maintenance.',
      level: 'info',
    });
  }

  if (daemonSets.length > 0) {
    validations.push({
      title: 'This node contains DaemonSet pods.',
      description:
        'These DaemonSets will prevent some pods from being moved. This should not prevent the host from powering off gracefully.',
      level: 'info',
      detail: (
        <ExpandableResources
          subject="daemon sets"
          resources={daemonSets}
          onLinkClicked={onLinkClicked}
        />
      ),
    });
  }

  if (staticPods.length > 0) {
    validations.push({
      title: 'This host contains unmanaged static pods.',
      description:
        'These pods must be moved manually to continue running after the host powers off.',
      level: 'warning',
      detail: (
        <ExpandableResources
          subject="unmanaged pods"
          resources={staticPods}
          onLinkClicked={onLinkClicked}
        />
      ),
    });
  }

  return (
    <div className="metal3-poweroff-validations">
      {validations.map((validation) => (
        <Alert variant={validation.level} isInline title={validation.title} key={validation.title}>
          {validation.description}
          {validation.detail}
        </Alert>
      ))}
    </div>
  );
};
