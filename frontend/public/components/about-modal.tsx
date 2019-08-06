import * as React from 'react';
import * as _ from 'lodash-es';
import { Alert, AboutModal as PfAboutModal, TextContent, TextList, TextListItem } from '@patternfly/react-core';
import { Link } from 'react-router-dom';

import { FLAGS } from '../const';
import { connectToFlags, FlagsObject } from '../reducers/features';
import { getBrandingDetails } from './masthead';
import { Firehose } from './utils';
import { ClusterVersionModel } from '../models';
import { ClusterVersionKind, referenceForModel } from '../module/k8s';
import { k8sVersion } from '../module/status';
import { hasAvailableUpdates, getK8sGitVersion, getOpenShiftVersion, getClusterID } from '../module/k8s/cluster-settings';

const AboutModalItems: React.FC<AboutModalItemsProps> = ({closeAboutModal, cv}) => {
  const [kubernetesVersion, setKubernetesVersion] = React.useState('');
  React.useEffect(() => {
    k8sVersion()
      .then(response => setKubernetesVersion(getK8sGitVersion(response) || '-'))
      .catch(() => setKubernetesVersion('unknown'));
  }, []);

  const clusterVersion = _.get(cv, 'data') as ClusterVersionKind;
  const clusterID = getClusterID(clusterVersion);
  const channel: string = _.get(cv, 'data.spec.channel');
  const openshiftVersion = getOpenShiftVersion(clusterVersion);
  return (
    <React.Fragment>
      {clusterVersion && hasAvailableUpdates(clusterVersion) && <Alert className="co-alert co-about-modal__alert" variant="info" title={<React.Fragment>Update available. <Link to="/settings/cluster" onClick={closeAboutModal}>View Cluster Settings</Link></React.Fragment>} />}
      <TextContent>
        <TextList component="dl">
          {openshiftVersion && (
            <React.Fragment>
              <TextListItem component="dt">OpenShift Version</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy">{openshiftVersion}</TextListItem>
            </React.Fragment>
          )}
          <TextListItem component="dt">Kubernetes Version</TextListItem>
          <TextListItem component="dd" className="co-select-to-copy">{kubernetesVersion}</TextListItem>
          {channel && (
            <React.Fragment>
              <TextListItem component="dt">Channel</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy">{channel}</TextListItem>
            </React.Fragment>
          )}
          {clusterID && (
            <React.Fragment>
              <TextListItem component="dt">Cluster ID</TextListItem>
              <TextListItem component="dd" className="co-select-to-copy">{clusterID}</TextListItem>
            </React.Fragment>
          )}
          <TextListItem component="dt">API Server</TextListItem>
          <TextListItem component="dd" className="co-select-to-copy">{window.SERVER_FLAGS.kubeAPIServerURL}</TextListItem>
        </TextList>
      </TextContent>
    </React.Fragment>
  );
};
AboutModalItems.displayName = 'AboutModalItems';

const AboutModal_: React.FC<AboutModalProps> = (props) => {
  const { isOpen, closeAboutModal, flags } = props;
  const details = getBrandingDetails();
  const customBranding = window.SERVER_FLAGS.customLogoURL || window.SERVER_FLAGS.customProductName;
  const resources = flags[FLAGS.CLUSTER_VERSION]
    ? [{ kind: referenceForModel(ClusterVersionModel), name: 'version', isList: false, prop: 'cv' }]
    : [];
  return (
    <PfAboutModal
      isOpen={isOpen}
      onClose={closeAboutModal}
      productName=""
      brandImageSrc={details.logoImg}
      brandImageAlt={details.productName}
      noAboutModalBoxContentContainer={true}
    >
      {!customBranding && <p>OpenShift is Red Hat&apos;s container application platform that allows developers to quickly develop, host,
        and scale applications in a cloud environment.</p>}
      <Firehose resources={resources}>
        <AboutModalItems {...props as any} />
      </Firehose>
    </PfAboutModal>
  );
};
export const AboutModal = connectToFlags(FLAGS.CLUSTER_VERSION)(AboutModal_);
AboutModal.displayName = 'AboutModal';

type AboutModalItemsProps = {
  closeAboutModal: () => void;
  cv?: {
    data?: ClusterVersionKind;
  };
};

type AboutModalProps = {
  isOpen: boolean;
  closeAboutModal: () => void;
  flags: FlagsObject;
};
