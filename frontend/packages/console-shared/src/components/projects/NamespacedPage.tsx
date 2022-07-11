import * as React from 'react';
import * as cx from 'classnames';
import {
  NamespacedPageProps,
  NamespacedPageVariants,
} from '@console/dynamic-plugin-sdk/src/api/internal-types';
import { NamespaceBar } from '@console/internal/components/namespace';
import NamespaceBarApplicationSelector from '@console/topology/src/components/dropdowns/NamespaceBarApplicationSelector';

import './NamespacedPage.scss';

const NamespacedPage: React.FC<NamespacedPageProps> = ({
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
      disabled={disabled}
      onNamespaceChange={onNamespaceChange}
      hideProjects={hideProjects}
    >
      {!hideApplications && <NamespaceBarApplicationSelector disabled={disabled} />}
      {toolbar && <div className="odc-namespaced-page__toolbar">{toolbar}</div>}
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
