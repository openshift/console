import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { usePodsForRevisions } from '../../utils/usePodsForRevisions';

type DeploymentOverviewListProps = {
  resource: K8sResourceKind;
};

const DeploymentOverviewList: FC<DeploymentOverviewListProps> = ({ resource }) => {
  const { t } = useTranslation();
  const { pods } = usePodsForRevisions(resource.metadata.uid, resource.metadata.namespace);
  const { obj } = pods?.[0] || {};
  const namespace = obj?.metadata?.namespace;
  const deploymentData = obj?.metadata?.ownerReferences[0];
  return (
    <>
      <SidebarSectionHeading text={t('knative-plugin~Deployment')} />
      {deploymentData && deploymentData.name ? (
        <List isPlain isBordered>
          <ListItem>
            <ResourceLink
              kind={deploymentData.kind}
              name={deploymentData.name}
              namespace={namespace}
            />
          </ListItem>
        </List>
      ) : (
        <span className="pf-v6-u-text-color-subtle">
          {t('knative-plugin~No Deployment found for this resource.')}
        </span>
      )}
    </>
  );
};

export default DeploymentOverviewList;
