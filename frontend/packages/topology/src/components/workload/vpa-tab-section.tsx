import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { FilterVerticalPodAutoscaler } from '@console/app/src/components/vpa/VerticalPodAutoscalerRecommendations';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceCommon } from '@console/internal/module/k8s';
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
      <SidebarSectionHeading text={t('topology~VerticalPodAutoscaler')} />
      <ul className="list-group">
        {vpas.map((vpa: K8sResourceCommon) => (
          <li key={vpa.metadata.name} className="list-group-item">
            <ResourceLink
              kind="autoscaling.k8s.io~v1~VerticalPodAutoscaler"
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
  const filteredVPAs = FilterVerticalPodAutoscaler(vpas, resource);

  const section = filteredVPAs ? (
    <TopologySideBarTabSection>
      <VPATabSection vpas={vpas} />
    </TopologySideBarTabSection>
  ) : undefined;
  return [section, true, undefined];
};
