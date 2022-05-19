import * as _ from 'lodash';
import { referenceForExtensionModel, ExtensionK8sModel } from '@console/internal/module/k8s';
import { NavLink, NavLinkProps } from './NavLink';
import { matchesExtensionModel, matchesModel } from './utils';

export class NavLinkResourceCluster extends NavLink<NavLinkResourceClusterProps> {
  static isActive(props, resourcePath) {
    if (props.model) {
      return (
        resourcePath === `/k8s/cluster/${referenceForExtensionModel(props.model)}` ||
        _.startsWith(resourcePath, `/k8s/cluster/${referenceForExtensionModel(props.model)}`) ||
        matchesExtensionModel(resourcePath, props.model)
      );
    }
    return (
      resourcePath === props.resource ||
      _.startsWith(resourcePath, `${props.resource}/`) ||
      matchesModel(resourcePath, props.model)
    );
  }

  get to() {
    const { model } = this.props;
    if (model) {
      return `/k8s/cluster/${referenceForExtensionModel(model)}`;
    }
    return `/k8s/cluster/${this.props.resource}`;
  }
}

export type NavLinkResourceClusterProps = NavLinkProps & {
  resource: string;
  model?: ExtensionK8sModel;
};
