import * as React from 'react';
import {
  Alert,
  AboutModal as PfAboutModal,
  TextContent,
  TextList,
  TextListItem,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useClusterVersion, BlueArrowCircleUpIcon } from '@console/shared';
import isMultiClusterEnabled from '@console/app/src/utils/isMultiClusterEnabled';
import { getBrandingDetails } from './masthead';
import { ReleaseNotesLink, useAccessReview } from './utils';
import { ClusterVersionModel } from '../models';
import { k8sVersion } from '../module/status';
import {
  getClusterID,
  getCurrentVersion,
  getK8sGitVersion,
  getOpenShiftVersion,
  hasAvailableUpdates,
} from '../module/k8s/cluster-settings';

const AboutModalItems: React.FC<AboutModalItemsProps> = ({ closeAboutModal }) => {
  const [kubernetesVersion, setKubernetesVersion] = React.useState('');
  const { t } = useTranslation();
  React.useEffect(() => {
    k8sVersion()
      .then((response) => setKubernetesVersion(getK8sGitVersion(response) || '-'))
      .catch(() => setKubernetesVersion(t('public~unknown')));
  }, [t]);
  const clusterVersion = useClusterVersion();

  const clusterID = getClusterID(clusterVersion);
  const channel: string = clusterVersion?.spec?.channel;
  const openshiftVersion = getOpenShiftVersion(clusterVersion);
  const { branding, kubeAPIServerURL } = window.SERVER_FLAGS;
  // TODO: get ACM version
  const acmVersion = isMultiClusterEnabled() ? 'PLACEHOLDER' : null;
  const clusterVersionIsEditable =
    useAccessReview({
      group: ClusterVersionModel.apiGroup,
      resource: ClusterVersionModel.plural,
      verb: 'patch',
      name: 'version',
    }) && branding !== 'dedicated';

  return (
    <>
      {clusterVersion && hasAvailableUpdates(clusterVersion) && clusterVersionIsEditable && (
        <Alert
          className="co-alert co-about-modal__alert"
          title={
            <>
              {/* PatternFly does not have an `update` alert variant
              See https://github.com/patternfly/patternfly-react/issues/4594 */}
              <BlueArrowCircleUpIcon className="pf-c-alert__icon pf-c-alert__icon--alt" />
              <Trans t={t} ns="public">
                Cluster update available.{' '}
                <Link to="/settings/cluster?showVersions" onClick={closeAboutModal}>
                  Update cluster
                </Link>
              </Trans>
            </>
          }
        />
      )}
      <TextContent>
        <TextList component="dl">
          {openshiftVersion && (
            <>
              <TextListItem component="dt">{t('public~OpenShift version')}</TextListItem>
              <TextListItem component="dd">
                <div className="co-select-to-copy">{openshiftVersion}</div>
                <ReleaseNotesLink version={getCurrentVersion(clusterVersion)} />
              </TextListItem>
            </>
          )}
          {acmVersion && (
            <>
              <TextListItem component="dt">{t('public~ACM version')}</TextListItem>
              <TextListItem component="dd">
                <div className="co-select-to-copy">{acmVersion}</div>
              </TextListItem>
            </>
          )}
          <TextListItem component="dt">{t('public~Kubernetes version')}</TextListItem>
          <TextListItem component="dd" className="co-select-to-copy">
            {kubernetesVersion}
          </TextListItem>
          {channel && (
            <>
              <TextListItem component="dt">{t('public~Channel')}</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy">
                {channel}
              </TextListItem>
            </>
          )}
          {clusterID && (
            <>
              <TextListItem component="dt">{t('public~Cluster ID')}</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy">
                {clusterID}
              </TextListItem>
            </>
          )}
          <TextListItem component="dt">{t('public~API server')}</TextListItem>
          <TextListItem component="dd" className="co-select-to-copy">
            {kubeAPIServerURL}
          </TextListItem>
        </TextList>
      </TextContent>
    </>
  );
};
AboutModalItems.displayName = 'AboutModalItems';

export const AboutModal: React.FC<AboutModalProps> = (props) => {
  const { isOpen, closeAboutModal } = props;
  const { t } = useTranslation();
  const details = getBrandingDetails();
  const customBranding = window.SERVER_FLAGS.customLogoURL || window.SERVER_FLAGS.customProductName;
  return (
    <PfAboutModal
      isOpen={isOpen}
      onClose={closeAboutModal}
      productName=""
      brandImageSrc={details.logoImg}
      brandImageAlt={details.productName}
      noAboutModalBoxContentContainer={true}
    >
      {!customBranding && (
        <p>
          {t(
            "public~OpenShift is Red Hat's container application platform that allows developers to quickly develop, host, and scale applications in a cloud environment.",
          )}
        </p>
      )}
      <AboutModalItems {...(props as any)} />
    </PfAboutModal>
  );
};
AboutModal.displayName = 'AboutModal';

type AboutModalItemsProps = {
  closeAboutModal: () => void;
};

type AboutModalProps = {
  isOpen: boolean;
  closeAboutModal: () => void;
};
