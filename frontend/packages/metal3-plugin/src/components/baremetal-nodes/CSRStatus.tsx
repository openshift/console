import * as React from 'react';
import { Button, Alert } from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { CertificateSigningRequestModel } from '@console/internal/models';
import { PopoverStatus, StatusIconAndText, SecondaryStatus } from '@console/shared';
import { CertificateSigningRequestKind } from '../../types';
import { approveCSR, denyCSR } from './menu-actions';

type CSRStatusProps = {
  csr: CertificateSigningRequestKind;
  title: string;
  serverCSR?: boolean;
};

const CSRStatus: React.FC<CSRStatusProps> = ({ csr, title, serverCSR }) => {
  const { t } = useTranslation();
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

  const clientCSRDesc = t(
    'metal3-plugin~This node has requested to join the cluster. After approving its certificate signing request the node will begin running workloads.',
  );

  const ServerCSRDesc = t(
    'metal3-plugin~This node has a pending server certificate signing request. Approve the request to enable all networking functionality on this node.',
  );

  return (
    <>
      <PopoverStatus
        title={t('metal3-plugin~Certificate approval required')}
        statusBody={<StatusIconAndText title={title} icon={<AddCircleOIcon />} />}
      >
        <div>{serverCSR ? ServerCSRDesc : clientCSRDesc}</div>
        <dl className="bmh-csr-section">
          <dt>{t('metal3-plugin~Request')}</dt>
          <dd>
            <ResourceLink kind={CertificateSigningRequestModel.kind} name={csr.metadata.name} />
          </dd>
          <dt>{t('metal3-plugin~Created')}</dt>
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
            {t('metal3-plugin~Deny')}
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
