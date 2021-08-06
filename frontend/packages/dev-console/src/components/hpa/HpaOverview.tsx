import * as React from 'react';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import { HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';

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
