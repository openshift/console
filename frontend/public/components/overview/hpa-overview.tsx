/**
 * @deprecated [TopologySideBar] This files has been moved to @console/topology and delete this once all the side panels uses dynamic extensions
 */
import * as React from 'react';
import { HorizontalPodAutoscalerKind } from '../../module/k8s';
import { ResourceLink, SidebarSectionHeading } from '../utils';
import { HorizontalPodAutoscalerModel } from '../../models';

type HPAOverviewProps = {
  hpas?: HorizontalPodAutoscalerKind[];
};

export const HPAOverview: React.FC<HPAOverviewProps> = ({ hpas }) => {
  if (!hpas?.length) {
    return null;
  }

  return (
    <>
      <SidebarSectionHeading text={HorizontalPodAutoscalerModel.labelPlural} />
      <ul className="list-group">
        {hpas.map((hpa: HorizontalPodAutoscalerKind) => (
          <li key={hpa.metadata.name} className="list-group-item">
            <ResourceLink
              kind={HorizontalPodAutoscalerModel.kind}
              name={hpa.metadata.name}
              namespace={hpa.metadata.namespace}
            />
          </li>
        ))}
      </ul>
    </>
  );
};
