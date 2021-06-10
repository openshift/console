import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { Node } from '@patternfly/react-topology';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ConsoleLinkModel } from '@console/internal/models';
import { routeDecoratorIcon } from '@console/dev-console/src/components/import/render-utils';
import { getCheDecoratorData, getEditURL } from '../../../../../utils';
import Decorator from './Decorator';

interface DefaultDecoratorProps {
  element: Node;
  radius: number;
  x: number;
  y: number;
}

const EditDecorator: React.FC<DefaultDecoratorProps> = ({ element, radius, x, y }) => {
  const { t } = useTranslation();
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const { cheURL, cheIconURL } = getCheDecoratorData(consoleLinks);
  const workloadData = element.getData().data;
  const { editURL, vcsURI, vcsRef } = workloadData;
  const cheEnabled = !!cheURL;
  const editUrl = editURL || getEditURL(vcsURI, vcsRef, cheURL);
  const repoIcon = routeDecoratorIcon(editUrl, radius, t, cheEnabled, cheIconURL);

  if (!repoIcon) {
    return null;
  }
  const label = t('topology~Edit source code');
  return (
    <Tooltip content={label} position={TooltipPosition.right}>
      <Decorator x={x} y={y} radius={radius} href={editUrl} external ariaLabel={label}>
        <g transform={`translate(-${radius / 2}, -${radius / 2})`}>{repoIcon}</g>
      </Decorator>
    </Tooltip>
  );
};

export default EditDecorator;
