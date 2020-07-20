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
    <div>
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
    </div>
  );
};
