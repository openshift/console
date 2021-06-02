import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { AsyncComponent } from '@console/internal/components/utils/async';
import { MsgBox } from '@console/internal/components/utils/status-box';
import {
  K8sResourceKind,
  GroupVersionKind,
  referenceForModel,
  referenceForGroupVersionKind,
} from '@console/internal/module/k8s';
import { OperatorGroupModel } from '../models';
import { OperatorGroupKind, SubscriptionKind, InstallModeType } from '../types';

export const targetNamespacesFor = (obj: K8sResourceKind) =>
  obj?.metadata?.annotations?.['olm.targetNamespaces'];
export const operatorNamespaceFor = (obj: K8sResourceKind) =>
  obj?.metadata?.annotations?.['olm.operatorNamespace'];
export const operatorGroupFor = (obj: K8sResourceKind) =>
  obj?.metadata?.annotations?.['olm.operatorGroup'];

export const NoOperatorGroupMsg: React.FC = () => {
  const { t } = useTranslation();
  return (
    <MsgBox
      title="Namespace Not Enabled"
      detail={
        <p>
          {t(
            'olm~The Operator Lifecycle Manager will not watch this Namespace because it is not configured with an OperatorGroup.',
          )}
          &nbsp;
          <Link to={`/ns/${getActiveNamespace()}/${referenceForModel(OperatorGroupModel)}/~new`}>
            {t('olm~Create one here.')}
          </Link>
        </p>
      }
    />
  );
};

export const OperatorGroupSelector: React.FC<OperatorGroupSelectorProps> = (props) => {
  const { t } = useTranslation();
  return (
    <AsyncComponent
      loader={() =>
        import('@console/internal/components/utils/list-dropdown').then((m) => m.ListDropdown)
      }
      onChange={
        props.onChange ||
        function() {
          return null;
        }
      }
      desc={OperatorGroupModel.plural}
      placeholder={t('olm~Select OperatorGroup')}
      selectedKeyKind={referenceForModel(OperatorGroupModel)}
      dataFilter={props.dataFilter}
      resources={[
        {
          kind: referenceForModel(OperatorGroupModel),
          fieldSelector: `metadata.name!=${props.excludeName}`,
        },
      ]}
    />
  );
};

export const requireOperatorGroup = <P extends RequireOperatorGroupProps>(
  Component: React.ComponentType<P>,
) => {
  return class RequireOperatorGroup extends React.Component<P> {
    static WrappedComponent = Component;

    render() {
      const namespaceEnabled =
        !_.get(this.props.operatorGroup, 'loaded') || !_.isEmpty(this.props.operatorGroup.data);

      return namespaceEnabled ? <Component {...this.props} /> : <NoOperatorGroupMsg />;
    }
  } as React.ComponentClass<P> & { WrappedComponent: React.ComponentType<P> };
};

export type InstallModeSet = { type: InstallModeType; supported: boolean }[];

/**
 * Logic consistent with https://github.com/operator-framework/operator-lifecycle-manager/blob/4ef074e4207f5518d95ddf8c378036dfc4270dda/pkg/api/apis/operators/v1alpha1/clusterserviceversion.go#L165.
 */
export const supports = (set: InstallModeSet) => (obj: OperatorGroupKind) => {
  const namespaces = obj?.status?.namespaces ?? [];
  const supportedModes = set.filter(({ supported }) => supported).map(({ type }) => type);

  if (namespaces.length === 0) {
    return false;
  }
  if (namespaces.length === 1) {
    if (namespaces[0] === obj.metadata.namespace) {
      return supportedModes.includes(InstallModeType.InstallModeTypeOwnNamespace);
    }
    if (namespaces[0] === '') {
      return supportedModes.includes(InstallModeType.InstallModeTypeAllNamespaces);
    }
    return supportedModes.includes(InstallModeType.InstallModeTypeSingleNamespace);
  }
  if (
    namespaces.length > 1 &&
    !supportedModes.includes(InstallModeType.InstallModeTypeMultiNamespace)
  ) {
    return false;
  }
  if (namespaces.length > 1) {
    if (
      namespaces.includes(obj.metadata.namespace) &&
      !supportedModes.includes(InstallModeType.InstallModeTypeOwnNamespace)
    ) {
      return false;
    }
    if (namespaces.includes('')) {
      return false;
    }
  }

  return true;
};

export const isGlobal = (obj: OperatorGroupKind) =>
  supports([{ type: InstallModeType.InstallModeTypeAllNamespaces, supported: true }])(obj);
export const isSingle = (obj: OperatorGroupKind) =>
  supports([{ type: InstallModeType.InstallModeTypeSingleNamespace, supported: true }])(obj);

/**
 * Determines if a given Operator package has a `Subscription` that makes it available in the given namespace.
 * Finds any `Subscriptions` for the given package, matches them to their `OperatorGroup`, and checks if the `OperatorGroup` is targeting the given namespace or if it is global.
 */
export const subscriptionFor = (allSubscriptions: SubscriptionKind[] = []) => (
  allGroups: OperatorGroupKind[] = [],
) => (pkgName: string) => (ns = '') => {
  return allSubscriptions
    .filter((sub) => sub.spec.name === pkgName)
    .find((sub) =>
      allGroups.some(
        (og) =>
          og.metadata.namespace === sub.metadata.namespace &&
          (isGlobal(og) || og.status?.namespaces?.includes(ns)),
      ),
    );
};

export const installedFor = (allSubscriptions: SubscriptionKind[] = []) => (
  allGroups: OperatorGroupKind[] = [],
) => (pkgName: string) => (ns = '') => {
  return !_.isNil(subscriptionFor(allSubscriptions)(allGroups)(pkgName)(ns));
};

export const providedAPIsForOperatorGroup = (og: OperatorGroupKind) =>
  (og?.metadata?.annotations?.['olm.providedAPIs'] ?? '')
    .split(',')
    .map((api) => ({
      group: api
        .split('.')
        .slice(2)
        .join('.'),
      version: api.split('.')[1],
      kind: api.split('.')[0],
    }))
    .map(({ group, version, kind }) => referenceForGroupVersionKind(group)(version)(kind));

type RequireOperatorGroupProps = {
  operatorGroup: { loaded: boolean; data?: OperatorGroupKind[] };
};

export type OperatorGroupSelectorProps = {
  onChange?: (name: string, kind: GroupVersionKind) => void;
  excludeName?: string;
  dataFilter?: (obj: OperatorGroupKind) => boolean;
};

NoOperatorGroupMsg.displayName = 'NoOperatorGroupMsg';
