import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk';
import { getGroupVersionKindForResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { getVerticalPodAutoscalersForResource } from '@console/shared/src';
import { TYPE_WORKLOAD } from '@console/topology/src/const';
import { getResource } from '../../utils';
import TopologySideBarTabSection from '../side-bar/TopologySideBarTabSection';

type VPATabSectionProps = {
  vpas: K8sResourceCommon[];
};

const VPATabSection: React.FC<VPATabSectionProps> = ({ vpas }) => {
  const { t } = useTranslation();
  return (
    <>
      <SidebarSectionHeading text={t('topology~VerticalPodAutoscalers')} />
      <ul className="list-group">
        {vpas.map((vpa: K8sResourceCommon) => (
          <li key={vpa.metadata.name} className="list-group-item">
            <ResourceLink
              groupVersionKind={getGroupVersionKindForResource(vpa)}
              name={vpa.metadata.name}
              namespace={vpa.metadata.namespace}
            />
          </li>
        ))}
      </ul>
    </>
  );
};

export const useVpaSideBarTabSection: DetailsTabSectionExtensionHook = (element: GraphElement) => {
  const [vpas] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: {
      group: 'autoscaling.k8s.io',
      version: 'v1',
      kind: 'VerticalPodAutoscaler',
    },
    isList: true,
    namespaced: true,
  });

  if (element.getType() !== TYPE_WORKLOAD) {
    return [undefined, true, undefined];
  }

  const resource = getResource(element);
  const verticalPodAutoscalers = getVerticalPodAutoscalersForResource(vpas, resource);

  const section =
    verticalPodAutoscalers.length > 0 ? (
      <TopologySideBarTabSection>
        <VPATabSection vpas={verticalPodAutoscalers} />
      </TopologySideBarTabSection>
    ) : undefined;
  return [section, true, undefined];
};
