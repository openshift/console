import * as React from 'react';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ExternalLink } from '@console/internal/components/utils/link';

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
