/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';

import { MsgBox } from '../utils/status-box';
import { K8sResourceKind, referenceForModel, GroupVersionKind } from '../../module/k8s';
import { OperatorGroupKind, SubscriptionKind } from './index';
import { AsyncComponent } from '../utils/async';
import { OperatorGroupModel } from '../../models';
import { getActiveNamespace } from '../../ui/ui-actions';

export const targetNamespacesFor = (obj: K8sResourceKind) => _.get(obj, ['metadata', 'annotations', 'olm.targetNamespaces']);
export const operatorNamespaceFor = (obj: K8sResourceKind) => _.get(obj, ['metadata', 'annotations', 'olm.operatorNamespace']);
export const operatorGroupFor = (obj: K8sResourceKind) => _.get(obj, ['metadata', 'annotations', 'olm.operatorGroup']);

export const NoOperatorGroupMsg: React.SFC = () => <MsgBox
  title="Namespace Not Enabled"
  detail={<p>The Operator Lifecycle Manager will not watch this namespace because it is not configured with an OperatorGroup. <Link to={`/ns/${getActiveNamespace()}/${referenceForModel(OperatorGroupModel)}/new`}>Create one here.</Link></p>} />;

type RequireOperatorGroupProps = {
  operatorGroup: {loaded: boolean, data?: OperatorGroupKind[]};
};

export const OperatorGroupSelector: React.SFC<OperatorGroupSelectorProps> = (props) => <AsyncComponent
  loader={() => import('../utils/list-dropdown').then(m => m.ListDropdown)}
  onChange={props.onChange || function() {
    return null;
  }}
  desc="Operator Groups"
  placeholder="Select Operator Group"
  selectedKeyKind={referenceForModel(OperatorGroupModel)}
  dataFilter={props.dataFilter}
  resources={[{kind: referenceForModel(OperatorGroupModel), fieldSelector: `metadata.name!=${props.excludeName}`}]} />;

export const requireOperatorGroup = <P extends RequireOperatorGroupProps>(Component: React.ComponentType<P>) => {
  return class RequireOperatorGroup extends React.Component<P> {
    static WrappedComponent = Component;

    render() {
      const namespaceEnabled = !_.get(this.props.operatorGroup, 'loaded') || !_.isEmpty(this.props.operatorGroup.data);

      return namespaceEnabled
        ? <Component {...this.props} />
        : <NoOperatorGroupMsg />;
    }
  } as React.ComponentClass<P> & {WrappedComponent: React.ComponentType<P>};
};

export enum InstallModeType {
  InstallModeTypeOwnNamespace = 'OwnNamespace',
  InstallModeTypeSingleNamespace = 'SingleNamespace',
  InstallModeTypeMultiNamespace = 'MultiNamespace',
  InstallModeTypeAllNamespaces = 'AllNamespaces',
}

export type InstallModeSet = {type: InstallModeType, supported: boolean}[];

/**
 * Logic consistent with https://github.com/operator-framework/operator-lifecycle-manager/blob/9febd60fde1837bf510308bbd6a5f10fed53c7ab/pkg/api/apis/operators/v1alpha1/clusterserviceversion.go#L158.
 */
export const supports = (set: InstallModeSet) => (obj: OperatorGroupKind) => {
  const namespaces = _.get(obj.status, 'namespaces') || [];
  const supportedModes = set.filter(({supported}) => supported).map(({type}) => type);

  if (namespaces.length === 1 && namespaces[0] === '') {
    return supportedModes.includes(InstallModeType.InstallModeTypeAllNamespaces);
  }
  if (namespaces.length === 1 && namespaces[0] !== '') {
    return supportedModes.includes(InstallModeType.InstallModeTypeSingleNamespace) || supportedModes.includes(InstallModeType.InstallModeTypeMultiNamespace);
  }
  if (namespaces.length > 1) {
    return supportedModes.includes(InstallModeType.InstallModeTypeMultiNamespace);
  }
  if (namespaces.includes(obj.metadata.namespace)) {
    return supportedModes.includes(InstallModeType.InstallModeTypeOwnNamespace);
  }
  if (namespaces.length > 1 && namespaces.includes('')) {
    return false;
  }
};

export const isGlobal = (obj: OperatorGroupKind) => supports([{type: InstallModeType.InstallModeTypeAllNamespaces, supported: true}])(obj);
export const isSingle = (obj: OperatorGroupKind) => supports([{type: InstallModeType.InstallModeTypeSingleNamespace, supported: true}])(obj);

/**
 * Determines if a given Operator package has a `Subscription` that makes it available in the given namespace.
 * Finds any `Subscriptions` for the given package, matches them to their `OperatorGroup`, and checks if the `OperatorGroup` is targeting the given namespace or if it is global.
 */
export const subscriptionFor = (allSubscriptions: SubscriptionKind[] = []) => (allGroups: OperatorGroupKind[] = []) => (pkgName: string) => (ns = '') => {
  return allSubscriptions.filter(sub => sub.spec.name === pkgName)
    .find(sub => allGroups.some(og => og.metadata.namespace === sub.metadata.namespace && (isGlobal(og) || _.get(og.status, 'namespaces', [] as string[]).includes(ns))));
};

export const installedFor = (allSubscriptions: SubscriptionKind[] = []) => (allGroups: OperatorGroupKind[] = []) => (pkgName: string) => (ns = '') => {
  return !_.isNil(subscriptionFor(allSubscriptions)(allGroups)(pkgName)(ns));
};

export type OperatorGroupSelectorProps = {
  onChange?: (name: string, kind: GroupVersionKind) => void;
  excludeName?: string;
  dataFilter?: (obj: OperatorGroupKind) => boolean;
};

NoOperatorGroupMsg.displayName = 'NoOperatorGroupMsg';
