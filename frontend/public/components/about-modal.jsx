import * as React from 'react';
import { AboutModal as PfAboutModal, TextContent, TextList, TextListItem } from '@patternfly/react-core';
import { k8sVersion } from '../module/status';

import { getBrandingDetails } from './masthead';

export class AboutModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      kubernetesVersion: null,
    };
  }

  componentDidMount() {
    this._checkKubernetesVersion();
  }

  _checkKubernetesVersion() {
    k8sVersion()
      .then(data => this.setState({ kubernetesVersion: data.gitVersion }))
      .catch(() => this.setState({ kubernetesVersion: 'unknown' }));
  }

  render() {
    const { isOpen, closeAboutModal } = this.props;
    const { kubernetesVersion } = this.state;
    const details = getBrandingDetails();

    return (
      <PfAboutModal
        isOpen={isOpen}
        onClose={closeAboutModal}
        productName={details.productTitle}
        trademark=""
        brandImageSrc={details.logoImg}
        brandImageAlt={details.logoAlt}
        logoImageSrc={details.logoImg}
        logoImageAlt={details.logoAlt}
        heroImageSrc={details.backgroundImg}
      >
        <h2>About</h2>
        <p>OpenShift is Red Hat&apos;s container application platform that allows developers to quickly develop, host, and scale applications in a cloud environment.</p>
        <br />
        <h2>Version</h2>
        <TextContent>
          <TextList component="dl">
            <TextListItem component="dt">Kubernetes Master</TextListItem>
            <TextListItem component="dd">{kubernetesVersion}</TextListItem>
          </TextList>
        </TextContent>
      </PfAboutModal>
    );
  }
}
