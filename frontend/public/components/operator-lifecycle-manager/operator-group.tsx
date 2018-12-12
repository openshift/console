/* eslint-disable no-undef, no-unused-vars */

import * as React from 'react';
import * as _ from 'lodash-es';

import { MsgBox } from '../utils/status-box';
import { K8sResourceKind } from '../../module/k8s';
import { OperatorGroupKind } from './index';

export const targetNamespacesFor = (obj: K8sResourceKind) => _.get(obj, ['metadata', 'annotations', 'olm.targetNamespaces']);
export const operatorNamespaceFor = (obj: K8sResourceKind) => _.get(obj, ['metadata', 'annotations', 'olm.operatorNamespace']);
export const operatorGroupFor = (obj: K8sResourceKind) => _.get(obj, ['metadata', 'annotations', 'olm.operatorGroup']);

export const NoOperatorGroupMsg: React.SFC = () => <MsgBox
  title="Namespace Not Enabled"
  // TODO(alecmerdler): Better description + link to docs
  detail="The Operator Lifecycle Manager will not watch this namespace because it is not configured with an OperatorGroup." />;

type RequireOperatorGroupProps = {
  operatorGroup: {loaded: boolean, data?: OperatorGroupKind[]};
};

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

NoOperatorGroupMsg.displayName = 'NoOperatorGroupMsg';
