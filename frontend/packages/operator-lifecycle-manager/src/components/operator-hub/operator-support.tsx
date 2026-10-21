import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { useCurrentChannel } from '../../hooks/useCurrentChannel';
import type { PackageManifestKind } from '../../types';
import { getSupportWorkflowUrl } from './operator-hub-utils';

export const OperatorSupport: FC<OperatorSupportProps> = ({ packageManifest }) => {
  const { t } = useTranslation('olm');
  const currentChannel = useCurrentChannel(packageManifest);
  const currentCSVAnnotations = currentChannel?.currentCSVDesc?.annotations ?? {};
  const support = currentCSVAnnotations?.support;
  const marketplaceSupportWorkflow =
    currentCSVAnnotations?.['marketplace.openshift.io/support-workflow'];
  const supportWorkflowUrl = getSupportWorkflowUrl(marketplaceSupportWorkflow);

  return supportWorkflowUrl ? (
    <ExternalLink href={supportWorkflowUrl}>{t('Get support')}</ExternalLink>
  ) : (
    <>{support || '-'}</>
  );
};

type OperatorSupportProps = {
  packageManifest: PackageManifestKind;
};
