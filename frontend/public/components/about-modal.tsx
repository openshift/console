import * as React from 'react';
import {
  Alert,
  AboutModal as PfAboutModal,
  TextContent,
  TextList,
  TextListItem,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { useClusterVersion, BlueArrowCircleUpIcon } from '@console/shared';
import { getBrandingDetails } from './masthead';
import { useAccessReview } from './utils';
import { ClusterVersionModel } from '../models';
import { k8sVersion } from '../module/status';
import {
  getClusterID,
  getCurrentVersion,
  getK8sGitVersion,
  getOpenShiftVersion,
  hasAvailableUpdates,
} from '../module/k8s/cluster-settings';
import { ReleaseNotesLink } from './cluster-settings/cluster-settings';

const AboutModalItems: React.FC<AboutModalItemsProps> = ({ closeAboutModal }) => {
  const [kubernetesVersion, setKubernetesVersion] = React.useState('');
  React.useEffect(() => {
    k8sVersion()
      .then((response) => setKubernetesVersion(getK8sGitVersion(response) || '-'))
      .catch(() => setKubernetesVersion('unknown'));
  }, []);
  const clusterVersion = useClusterVersion();

  const clusterID = getClusterID(clusterVersion);
  const channel: string = clusterVersion?.spec?.channel;
  const openshiftVersion = getOpenShiftVersion(clusterVersion);
  const clusterVersionIsEditable =
    useAccessReview({
      group: ClusterVersionModel.apiGroup,
      resource: ClusterVersionModel.plural,
      verb: 'patch',
      name: 'version',
    }) && window.SERVER_FLAGS.branding !== 'dedicated';

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
              Cluster update available.{' '}
              <Link to="/settings/cluster?showVersions" onClick={closeAboutModal}>
                Update cluster
              </Link>
            </>
          }
        />
      )}
      <TextContent>
        <TextList component="dl">
          {openshiftVersion && (
            <>
              <TextListItem component="dt">OpenShift Version</TextListItem>
              <TextListItem component="dd">
                <div className="co-select-to-copy">{openshiftVersion}</div>
                <ReleaseNotesLink version={getCurrentVersion(clusterVersion)} />
              </TextListItem>
            </>
          )}
          <TextListItem component="dt">Kubernetes Version</TextListItem>
          <TextListItem component="dd" className="co-select-to-copy">
            {kubernetesVersion}
          </TextListItem>
          {channel && (
            <>
              <TextListItem component="dt">Channel</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy">
                {channel}
              </TextListItem>
            </>
          )}
          {clusterID && (
            <>
              <TextListItem component="dt">Cluster ID</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy">
                {clusterID}
              </TextListItem>
            </>
          )}
          <TextListItem component="dt">API Server</TextListItem>
          <TextListItem component="dd" className="co-select-to-copy">
            {window.SERVER_FLAGS.kubeAPIServerURL}
          </TextListItem>
        </TextList>
      </TextContent>
    </>
  );
};
AboutModalItems.displayName = 'AboutModalItems';

export const AboutModal: React.FC<AboutModalProps> = (props) => {
  const { isOpen, closeAboutModal } = props;
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
          OpenShift is Red Hat&apos;s container application platform that allows developers to
          quickly develop, host, and scale applications in a cloud environment.
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
