import type { ReactNode, FC } from 'react';
import { css } from '@patternfly/react-styles';
import { NamespaceBar } from '@console/internal/components/namespace-bar';
import NamespaceBarApplicationSelector from '@console/topology/src/components/dropdowns/NamespaceBarApplicationSelector';

import './NamespacedPage.scss';

export enum NamespacedPageVariants {
  light = 'light',
  default = 'default',
}

export interface NamespacedPageProps {
  children?: ReactNode;
  disabled?: boolean;
  hideProjects?: boolean;
  hideApplications?: boolean;
  onNamespaceChange?: (newNamespace: string) => void;
  variant?: NamespacedPageVariants;
  toolbar?: ReactNode;
}

const NamespacedPage: FC<NamespacedPageProps> = ({
  children,
  disabled,
  onNamespaceChange,
  hideProjects = false,
  hideApplications = false,
  variant = NamespacedPageVariants.default,
  toolbar,
}) => (
  <div className="odc-namespaced-page">
    <NamespaceBar
      isDisabled={disabled}
      onNamespaceChange={onNamespaceChange}
      hideProjects={hideProjects}
    >
      {!hideApplications && <NamespaceBarApplicationSelector disabled={disabled} />}
      {toolbar && <div className="odc-namespaced-page__toolbar">{toolbar}</div>}
    </NamespaceBar>
    <div
      className={css('odc-namespaced-page__content', {
        [`is-${variant}`]: variant !== NamespacedPageVariants.default,
      })}
    >
      {children}
    </div>
  </div>
);

export default NamespacedPage;
