import type { FC } from 'react';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';

const LauncherItem: FC<LauncherItemProps> = ({ consoleLink }) => (
  <ExternalLink
    className="co-launcher-card__item"
    href={consoleLink.spec.href}
    text={consoleLink.spec.text}
    dataTestID="launcher-item"
  />
);

export default LauncherItem;

type LauncherItemProps = {
  consoleLink: K8sResourceKind;
};
