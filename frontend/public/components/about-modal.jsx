import * as React from 'react';
import { AboutModal as PfAboutModal, TextContent, TextList, TextListItem } from '@patternfly/react-core';
import { k8sVersion } from '../module/status';

import { getBrandingDetails } from './masthead';
import { connect } from 'react-redux';
import { clusterIDStateToProps } from '../ui/ui-reducers';


class AboutModal_ extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      kubernetesVersion: null,
      clusterName: null,
    };
  }

  componentDidMount() {
    this._checkKubernetesVersion();
  }

  _checkKubernetesVersion() {
    k8sVersion()
      .then(data => this.setState({kubernetesVersion: data.gitVersion}))
      .catch(() => this.setState({kubernetesVersion: 'unknown'}));
  }

  render() {
    const {isOpen, closeAboutModal} = this.props;
    const {kubernetesVersion} = this.state;
    const details = getBrandingDetails();

    return (
      <PfAboutModal
        isOpen={isOpen}
        onClose={closeAboutModal}
        productName={details.productTitle}
        brandImageSrc={details.logoImg}
        brandImageAlt={details.logoAlt}
        logoImageSrc={details.logoImg}
        logoImageAlt={details.logoAlt}
        heroImageSrc={details.backgroundImg}
      >
        <p>OpenShift is Red Hat&apos;s container application platform that allows developers to quickly develop, host,
          and scale applications in a cloud environment.</p>
        <br />
        <TextContent>
          <TextList component="dl">
            {this.props.clusterID &&
            <TextListItem component="dt">Cluster ID</TextListItem>}
            {this.props.clusterID &&
            <TextListItem component="dd">{this.props.clusterID}</TextListItem>}
            <TextListItem component="dt">Kubernetes Master Version</TextListItem>
            <TextListItem component="dd">{kubernetesVersion}</TextListItem>
          </TextList>
        </TextContent>
      </PfAboutModal>
    );
  }
}

export const AboutModal = connect(clusterIDStateToProps)(AboutModal_);
