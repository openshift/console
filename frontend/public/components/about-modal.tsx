/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { connect } from 'react-redux';
import { AboutModal as PfAboutModal, TextContent, TextList, TextListItem } from '@patternfly/react-core';

import { clusterIDStateToProps } from '../ui/ui-reducers';
import { getBrandingDetails } from './masthead';
import { k8sVersion } from '../module/status';

const AboutModal_: React.FC<AboutModalProps> = ({isOpen, closeAboutModal, clusterID}) => {
  const [kubernetesVersion, setKubernetesVersion] = React.useState('');
  React.useEffect(() => {
    k8sVersion()
      .then(({gitVersion}) => setKubernetesVersion(gitVersion))
      .catch(() => setKubernetesVersion('unknown'));
  }, []);

  const details = getBrandingDetails();

  return (
    <PfAboutModal
      isOpen={isOpen}
      onClose={closeAboutModal}
      productName=""
      brandImageSrc={details.logoImg}
      brandImageAlt={details.productName}
    >
      <p>OpenShift is Red Hat&apos;s container application platform that allows developers to quickly develop, host,
        and scale applications in a cloud environment.</p>
      <br />
      <TextContent>
        <TextList component="dl">
          {clusterID && (
            <React.Fragment>
              <TextListItem component="dt">Cluster ID</TextListItem>
              <TextListItem component="dd">{this.props.clusterID}</TextListItem>
            </React.Fragment>
          )}
          <TextListItem component="dt">Kubernetes Master Version</TextListItem>
          <TextListItem component="dd">{kubernetesVersion}</TextListItem>
        </TextList>
      </TextContent>
    </PfAboutModal>
  );
};
export const AboutModal = connect(clusterIDStateToProps)(AboutModal_);
AboutModal.displayName = 'AboutModal';

type AboutModalProps = {
  isOpen: boolean;
  closeAboutModal: () => void;
  clusterID: string;
};
