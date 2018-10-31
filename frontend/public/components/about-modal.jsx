import * as React from 'react';
import { AboutModal as PfAboutModal, TextContent, TextList, TextListItem } from '@patternfly/react-core';
import { FLAGS, connectToFlags } from '../features';
import { k8sVersion } from '../module/status';
import { coFetchJSON } from '../co-fetch';
import * as okdLogoImg from '../imgs/okd-logo.svg'; // eslint-disable-line import/no-duplicates
import * as ocpLogoImg from '../imgs/openshift-platform-logo.svg';
import * as onlineLogoImg from '../imgs/openshift-online-logo.svg';
import * as dedicatedLogoImg from '../imgs/openshift-dedicated-logo.svg';
//todo: replace with new about modal rh logo
import * as rhLogoImg from '../imgs/okd-logo.svg'; // eslint-disable-line import/no-duplicates
//todo: replace with new about modal okd logo
import * as okdModalImg from '../imgs/okd-logo.svg'; // eslint-disable-line import/no-duplicates
import * as pfBg992 from '../../public/imgs/pfbg_992.jpg';

class AboutModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      openshiftVersion: null,
      kubernetesVersion: null,
    };
  }

  componentDidMount() {
    this._checkOpenShiftVersion();
    this._checkKubernetesVersion();
  }

  componentDidUpdate(prevProps){
    if (prevProps.openshiftFlag !== this.props.openshiftFlag){
      this._checkOpenShiftVersion();
    }
  }

  _checkOpenShiftVersion() {
    const openshiftFlag = this.props.openshiftFlag;
    if (openshiftFlag) {
      coFetchJSON('api/kubernetes/version/openshift')
        .then(data => {
          this.setState({ openshiftVersion: data.gitVersion });
        })
        .catch(() => this.setState({ openshiftVersion: 'unknown' }));
    }
  }

  _checkKubernetesVersion() {
    k8sVersion()
      .then(data => this.setState({ kubernetesVersion: data.gitVersion }))
      .catch(() => this.setState({ kubernetesVersion: 'unknown' }));
  }

  render() {
    const { isOpen, closeAboutModal, backgroundImg, logoAlt, logoImg, title } = this.props;
    const { openshiftVersion, kubernetesVersion } = this.state;

    return (
      <PfAboutModal
        isOpen={isOpen}
        onClose={closeAboutModal}
        productName={title}
        trademark="Trademark and copyright information here"
        brandImageSrc={logoImg}
        brandImageAlt={logoAlt}
        //todo: add dark bgs suitable for white background, currently display:none'd
        logoImageSrc={logoImg}
        logoImageAlt={logoAlt}
        heroImageSrc={backgroundImg}
      >
        <h2>About</h2>
        <p>OpenShift is Red Hat&apos;s container application platform that allows developers to quickly develop, host, and scale applications in a cloud environment.</p>
        <br />
        <h2>Version</h2>
        <TextContent>
          <TextList component="dl">
            <TextListItem component="dt">OpenShift Master</TextListItem>
            <TextListItem component="dd">{openshiftVersion}</TextListItem>
            <TextListItem component="dt">Kubernetes Master</TextListItem>
            <TextListItem component="dd">{kubernetesVersion}</TextListItem>
          </TextList>
        </TextContent>
      </PfAboutModal>
    );
  }
}

const BrandingDetails = () => {
  let backgroundImg, logoImg, logoAlt, modalLogoImg, modalLogoAlt, productTitle;
  // Webpack won't bundle these images if we don't directly reference them, hence the switch
  switch (window.SERVER_FLAGS.branding) {
    case 'ocp':
      backgroundImg = pfBg992;
      logoImg = ocpLogoImg;
      logoAlt = 'OpenShift Container Platform';
      modalLogoImg = rhLogoImg;
      modalLogoAlt = 'Red Hat';
      productTitle = (
        <React.Fragment>
          Red Hat<sup>&reg;</sup> OpenShift Container Platform
        </React.Fragment>
      );
      break;
    case 'online':
      backgroundImg = pfBg992;
      logoImg = onlineLogoImg;
      logoAlt = 'OpenShift Online';
      modalLogoImg = rhLogoImg;
      modalLogoAlt = 'Red Hat';
      productTitle = (
        <React.Fragment>
          Red Hat<sup>&reg;</sup> OpenShift Online
        </React.Fragment>
      );
      break;
    case 'dedicated':
      backgroundImg = pfBg992;
      logoImg = dedicatedLogoImg;
      logoAlt = 'OpenShift Dedicated';
      modalLogoImg = rhLogoImg;
      modalLogoAlt = 'Red Hat';
      productTitle = (
        <React.Fragment>
          Red Hat<sup>&reg;</sup> OpenShift Dedicated
        </React.Fragment>
      );
      break;
    default:
      backgroundImg = pfBg992;
      logoImg = okdLogoImg;
      logoAlt = 'OKD';
      modalLogoImg = okdModalImg;
      modalLogoAlt = 'OKD';
      productTitle = 'OKD';
  }
  return { backgroundImg: backgroundImg, logoImg: logoImg, logoAlt: logoAlt, modalLogo: modalLogoImg, modalLogoAlt: modalLogoAlt, productTitle: productTitle };
};

const AboutModalWrapper = connectToFlags(FLAGS.OPENSHIFT)(props => {
  const details = BrandingDetails();
  return (
    <AboutModal
      isOpen={props.isOpen}
      closeAboutModal={props.closeAboutModal}
      backgroundImg={details.backgroundImg}
      logoAlt={details.modalLogoAlt}
      logoImg={details.modalLogo}
      openshiftFlag={props.flags[FLAGS.OPENSHIFT]}
      title={details.productTitle}
    />
  );
});
export default AboutModalWrapper;
