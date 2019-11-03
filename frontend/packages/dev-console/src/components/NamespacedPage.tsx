import * as React from 'react';
import * as cx from 'classnames';
import { NamespaceBar } from '@console/internal/components/namespace';
import ApplicationSelector from './dropdown/ApplicationSelector';

import './NamespacedPage.scss';

export enum NamespacedPageVariants {
  light = 'light',
  default = 'default',
}

export interface NamespacedPageProps {
  disabled?: boolean;
  hideApplications?: boolean;
  onNamespaceChange?: (newNamespace: string) => void;
  variant?: NamespacedPageVariants;
  toolbar?: React.ReactNode;
}

const NamespacedPage: React.FC<NamespacedPageProps> = ({
  children,
  disabled,
  onNamespaceChange,
  hideApplications = false,
  variant = NamespacedPageVariants.default,
  toolbar,
}) => (
  <div className="odc-namespaced-page">
    <NamespaceBar disabled={disabled} onNamespaceChange={onNamespaceChange}>
      {!hideApplications && <ApplicationSelector disabled={disabled} />}
      {toolbar && <div style={{ marginLeft: 'auto' }}>{toolbar}</div>}
    </NamespaceBar>
    <div
      className={cx('odc-namespaced-page__content', {
        [`is-${variant}`]: variant !== NamespacedPageVariants.default,
      })}
    >
      {children}
    </div>
  </div>
);

export default NamespacedPage;
