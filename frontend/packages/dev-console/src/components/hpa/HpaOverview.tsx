import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { HorizontalPodAutoscalerModel } from '@console/internal/models';
import type { HorizontalPodAutoscalerKind } from '@console/internal/module/k8s';

type HPAOverviewProps = {
  hpas?: HorizontalPodAutoscalerKind[];
};

export const HPAOverview: FC<HPAOverviewProps> = ({ hpas }) => {
  if (!hpas?.length) {
    return null;
  }

  return (
    <>
      <SidebarSectionHeading text={HorizontalPodAutoscalerModel.labelPlural} />
      <List isPlain isBordered>
        {hpas.map((hpa: HorizontalPodAutoscalerKind) => (
          <ListItem key={hpa.metadata.name}>
            <ResourceLink
              kind={HorizontalPodAutoscalerModel.kind}
              name={hpa.metadata.name}
              namespace={hpa.metadata.namespace}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
};
