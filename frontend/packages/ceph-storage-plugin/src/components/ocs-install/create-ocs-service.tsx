import * as React from 'react';
import { match } from 'react-router';
import { Alert } from '@patternfly/react-core';
import NodeTableWithFirehose from './node-list';

const CreateOCSService: React.FC<CreateOCSServiceProps> = React.memo((props) => {
  return (
    <>
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
          <NodeTableWithFirehose match={props.match} />
        </div>
      </form>
    </>
  );
});

export default CreateOCSService;

type CreateOCSServiceProps = {
  match: match<{ appName: string; ns: string }>;
};
