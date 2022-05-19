import { NavLink, NavLinkProps } from './NavLink';
import { matchesExtensionModel, stripNS, matchesPath } from './utils';
import {
  formatNamespacedRouteForResource,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  ALL_NAMESPACES_KEY,
} from '@console/shared';
import { ExtensionK8sModel, referenceForExtensionModel } from '@console/internal/module/k8s';

// TODO [tech debt] Refactor to get rid of inheritance and implement as function component.
export class NavLinkResourceNS extends NavLink<NavLinkResourceNSProps> {
  static isActive(props, resourcePath, activeNamespace) {
    if (props.model) {
      return matchesExtensionModel(resourcePath, props.model);
    }
    const href = stripNS(formatNamespacedRouteForResource(props.resource, activeNamespace));
    return matchesPath(resourcePath, href);
  }

  get to() {
    const { resource, activeNamespace, model } = this.props;
    const lastNamespace = sessionStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);

    if (model) {
      return formatNamespacedRouteForResource(
        referenceForExtensionModel(model),
        lastNamespace === ALL_NAMESPACES_KEY ? lastNamespace : activeNamespace,
      );
    }
    return formatNamespacedRouteForResource(
      resource,
      lastNamespace === ALL_NAMESPACES_KEY ? lastNamespace : activeNamespace,
    );
  }
}

export type NavLinkResourceNSProps = NavLinkProps & {
  resource: string;
  model?: ExtensionK8sModel;
  activeNamespace?: string;
};
