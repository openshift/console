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
  const title = 'Create New OCS Service';
  const ListComponent = React.useCallback(
    (nodeProps) => <NodeList {...nodeProps} ocsProps={{ namespace, clusterServiceVersion }} />,
    [namespace, clusterServiceVersion],
  );

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
        <div className="co-m-pane__name">{title}</div>
      </h1>
      <p className="co-m-pane__explanation">
        OCS runs as a cloud-native service for optimal integration with applications in need of
        storage, and handles the scenes such as provisioning and management.
      </p>
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
          <p>
            3 selected nodes are used for initial deployment. The remaining selected nodes will be
            used by OpenShift as scheduling targets for OCS scaling.
          </p>
          <ListPage kind={NodeModel.kind} showTitle={false} ListComponent={ListComponent} />
        </div>
      </form>
    </div>
  );
};

type CreateOCSServiceFormProps = {
  operandModel: K8sKind;
  sample?: K8sResourceKind;
  namespace: string;
  clusterServiceVersion: ClusterServiceVersionKind;
};
