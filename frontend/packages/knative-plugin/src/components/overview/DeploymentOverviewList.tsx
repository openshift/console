import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { PodControllerOverviewItem } from '@console/shared';

type DeploymentOverviewListProps = {
  current: PodControllerOverviewItem;
};

const DeploymentOverviewList: React.FC<DeploymentOverviewListProps> = ({ current }) => {
  const { t } = useTranslation();
  const { obj } = current || {};
  const namespace = obj?.metadata?.namespace;
  const deploymentData = obj?.metadata?.ownerReferences[0];
  return (
    <>
      <SidebarSectionHeading text={t('knative-plugin~Deployment')} />
      {deploymentData && deploymentData.name ? (
        <ul className="list-group">
          <li className="list-group-item">
            <ResourceLink
              kind={deploymentData.kind}
              name={deploymentData.name}
              namespace={namespace}
            />
          </li>
        </ul>
      ) : (
        <span className="text-muted">
          {t('knative-plugin~No Deployment found for this resource.')}
        </span>
      )}
    </>
  );
};

export default DeploymentOverviewList;
