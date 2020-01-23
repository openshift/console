import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { ListPage } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src/types';
import { NodeList } from './node-list';

import './ocs-install.scss';

export const CreateOCSServiceForm: React.FC<CreateOCSServiceFormProps> = ({
  namespace,
  clusterServiceVersion,
}) => {
  const ListComponent = React.useCallback(
    (nodeProps) => <NodeList {...nodeProps} ocsProps={{ namespace, clusterServiceVersion }} />,
    [namespace, clusterServiceVersion],
  );

  return (
    <form className="co-m-pane__body-group">
      <div className="form-group co-create-route__name">
        <label htmlFor="select-node-help">Select Nodes</label>
        <p className="co-m-pane__explanation">
          Selected nodes will be labeled with
          <code>cluster.ocs.openshift.io/openshift-storage=&quot;&quot;</code> to create the OCS
          Service.
        </p>
        <Alert
          className="co-alert"
          variant="info"
          title="A bucket will be created to provide the OCS Service."
          isInline
        />
        <p className="co-legend co-required ceph-ocs-desc__legend">
          Select at least 3 nodes in different failure domains you wish to use.
        </p>
        <ListPage kind={NodeModel.kind} showTitle={false} ListComponent={ListComponent} />
      </div>
    </form>
  );
};

type CreateOCSServiceFormProps = {
  operandModel: K8sKind;
  sample?: K8sResourceKind;
  namespace: string;
  clusterServiceVersion: ClusterServiceVersionKind;
};
