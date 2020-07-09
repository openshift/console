import * as React from 'react';
import { Button, Alert } from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons';
import { PopoverStatus, StatusIconAndText, SecondaryStatus } from '@console/shared';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { CertificateSigningRequestModel } from '@console/internal/models';

import { approveCSR, denyCSR } from './menu-actions';
import { CertificateSigningRequestKind } from '../../types';

const CLIENT_CSR_DESC =
  'This node has requested to join the cluster. After approving its certificate signing request the node will begin running workloads.';

const SERVER_CSR_DESC =
  'This node has a pending server certificate signing request. Approve the request to enable all networking functionality on this node.';

type CSRStatusProps = {
  csr: CertificateSigningRequestKind;
  title: string;
  serverCSR?: boolean;
};

const CSRStatus: React.FC<CSRStatusProps> = ({ csr, title, serverCSR }) => {
  const [inProgress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const updateCSR = async (approve: boolean) => {
    setError(null);
    setInProgress(true);
    try {
      await (approve ? approveCSR(csr) : denyCSR(csr));
    } catch (err) {
      setError(`${csr.metadata.name} ${approve ? 'approval' : 'denial'} failed - ${err}`);
    } finally {
      setInProgress(false);
    }
  };
  return (
    <>
      <PopoverStatus
        title="Certificate approval required"
        statusBody={<StatusIconAndText title={title} icon={<AddCircleOIcon />} />}
      >
        <div>{serverCSR ? SERVER_CSR_DESC : CLIENT_CSR_DESC}</div>
        <dl className="bmh-csr-section">
          <dt>Request</dt>
          <dd>
            <ResourceLink kind={CertificateSigningRequestModel.kind} name={csr.metadata.name} />
          </dd>
          <dt>Created</dt>
          <dd>
            <Timestamp timestamp={csr.metadata.creationTimestamp} />
          </dd>
        </dl>
        <div className="bmh-csr-section">
          <Button
            variant="link"
            onMouseUp={() => updateCSR(true)}
            isDisabled={inProgress}
            isInline
            className="bmh-csr-action"
          >
            Approve
          </Button>
          <Button
            variant="link"
            onMouseUp={() => updateCSR(false)}
            isDisabled={inProgress}
            isInline
          >
            Deny
          </Button>
        </div>
        {error && (
          <div className="bmh-csr-section">
            <Alert variant="danger" isInline title={error} />
          </div>
        )}
      </PopoverStatus>
      <SecondaryStatus status="Approval required" />
    </>
  );
};

export default CSRStatus;
