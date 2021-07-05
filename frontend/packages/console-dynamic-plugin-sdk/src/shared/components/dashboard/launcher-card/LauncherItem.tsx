import * as React from 'react';
import { ExternalLink } from '@console/internal/components/utils/link';
import { K8sResourceKind } from '@console/internal/module/k8s';

const LauncherItem: React.FC<LauncherItemProps> = ({ consoleLink }) => (
  <ExternalLink
    additionalClassName="co-launcher-card__item"
    href={consoleLink.spec.href}
    text={consoleLink.spec.text}
  />
);

export default LauncherItem;

type LauncherItemProps = {
  consoleLink: K8sResourceKind;
};
