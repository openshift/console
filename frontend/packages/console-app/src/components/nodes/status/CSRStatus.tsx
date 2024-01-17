import * as React from 'react';
import {
  Button,
  Alert,
  Stack,
  StackItem,
  Split,
  SplitItem,
  ExpandableSection,
} from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons/dist/esm/icons/add-circle-o-icon';
import { useTranslation } from 'react-i18next';
import {
  CertificateSigningRequestKind,
  IsNodeStatusActive,
  NodePopoverContentProps,
  PopoverStatus,
  StatusIconAndText,
} from '@console/dynamic-plugin-sdk';
import { ResourceLink, Timestamp } from '@console/internal/components/utils';
import { CertificateSigningRequestModel } from '@console/internal/models';
import { SecondaryStatus } from '@console/shared';
import { getNodeServerCSR } from '../csr';
import { approveCSR, denyCSR } from '../menu-actions';

type NodeStatusResources = { csrs: CertificateSigningRequestKind[] };

export const isCSRActive: IsNodeStatusActive<NodeStatusResources> = (node, resources) => {
  if (resources.csrs?.loaded && !resources.csrs?.loadError) {
    return !!getNodeServerCSR(resources.csrs.data, node);
  }
  return false;
};

type CSRPopoverContentProps = {
  csr: CertificateSigningRequestKind;
  serverCSR?: boolean;
  onPatch?: VoidFunction;
};

export const CSRPopoverContent: React.FC<CSRPopoverContentProps> = ({
  csr,
  serverCSR,
  onPatch,
}) => {
  const { t } = useTranslation();
  const [inProgress, setInProgress] = React.useState(false);
  const [error, setError] = React.useState<string>();
  const updateCSR = async (approve: boolean) => {
    setError(null);
    setInProgress(true);
    try {
      await (approve ? approveCSR(csr) : denyCSR(csr));
      onPatch?.();
    } catch (err) {
      setError(`${csr.metadata.name} ${approve ? 'approval' : 'denial'} failed - ${err}`);
    } finally {
      setInProgress(false);
    }
  };

  const clientCSRDesc = t(
    'console-app~This node has requested to join the cluster. After approving its certificate signing request the node will begin running workloads.',
  );

  const ServerCSRDesc = t(
    'console-app~This node has a pending server certificate signing request. Approve the request to enable all networking functionality on this node.',
  );

  return (
    <Stack hasGutter>
      <StackItem>{serverCSR ? ServerCSRDesc : clientCSRDesc}</StackItem>
      <StackItem>
        <div>
          <b>{t('console-app~Request')}</b>
        </div>
        <div>
          <ResourceLink
            name={csr.metadata.name}
            groupVersionKind={{
              kind: CertificateSigningRequestModel.kind,
              version: CertificateSigningRequestModel.apiVersion,
              group: CertificateSigningRequestModel.apiGroup,
            }}
          />
        </div>
      </StackItem>
      <StackItem>
        <div>
          <b>{t('console-app~Created')}</b>
        </div>
        <div>
          <Timestamp timestamp={csr.metadata.creationTimestamp} />
        </div>
      </StackItem>
      <StackItem>
        <Split hasGutter>
          <SplitItem>
            <Button
              variant="link"
              onMouseUp={() => updateCSR(true)}
              isDisabled={inProgress}
              isInline
            >
              {t('console-app~Approve')}
            </Button>
          </SplitItem>
          <SplitItem>
            <Button
              variant="link"
              onMouseUp={() => updateCSR(false)}
              isDisabled={inProgress}
              isInline
            >
              {t('console-app~Deny')}
            </Button>
          </SplitItem>
        </Split>
      </StackItem>
      {error && (
        <StackItem>
          <Alert variant="danger" isInline title={error} />
        </StackItem>
      )}
    </Stack>
  );
};

type StatusTitleProps = {
  title?: string;
};

const StatusTitle: React.FC<StatusTitleProps> = ({ title }) => {
  const { t } = useTranslation();
  return (
    <StatusIconAndText
      title={title || t('console-app~Approval required')}
      icon={<AddCircleOIcon />}
    />
  );
};

export const ServerCSRPopoverContent: React.FC<NodePopoverContentProps<NodeStatusResources>> = ({
  node,
  resources,
}) => {
  const [isExpanded, setExpanded] = React.useState(true);
  const serverCSR = getNodeServerCSR(resources.csrs.data, node);
  return (
    <ExpandableSection
      isExpanded={isExpanded}
      onToggle={(_, expanded) => setExpanded(expanded)}
      toggleContent={<StatusTitle />}
    >
      <CSRPopoverContent csr={serverCSR} serverCSR />
    </ExpandableSection>
  );
};

type ClientCSRStatusProps = CSRPopoverContentProps & {
  title: string;
};

const ClientCSRStatus: React.FC<ClientCSRStatusProps> = ({ title, ...rest }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <PopoverStatus
        title={t('console-app~Certificate approval required')}
        statusBody={<StatusTitle title={title} />}
        isVisible={isOpen}
        shouldClose={() => setIsOpen(false)}
        shouldOpen={() => setIsOpen(true)}
      >
        <CSRPopoverContent {...rest} onPatch={() => setIsOpen(false)} />
      </PopoverStatus>
      <SecondaryStatus status={t('console-app~Approval required')} />
    </>
  );
};

export default ClientCSRStatus;
