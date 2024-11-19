import okdLogoImg from '../../imgs/okd-logo.svg';
import openshiftLogoImg from '../../imgs/openshift-logo.svg';
import onlineLogoImg from '../../imgs/openshift-online-logo.svg';
import dedicatedLogoImg from '../../imgs/openshift-dedicated-logo.svg';
import rosaLogoImg from '../../imgs/openshift-service-on-aws-logo.svg';

export const getBrandingDetails = () => {
  let logoImg, productName;
  // Webpack won't bundle these images if we don't directly reference them, hence the switch
  switch (window.SERVER_FLAGS.branding) {
    case 'openshift':
      logoImg = openshiftLogoImg;
      productName = 'Red Hat OpenShift';
      break;
    case 'ocp':
      logoImg = openshiftLogoImg;
      productName = 'Red Hat OpenShift';
      break;
    case 'online':
      logoImg = onlineLogoImg;
      productName = 'Red Hat OpenShift Online';
      break;
    case 'dedicated':
      logoImg = dedicatedLogoImg;
      productName = 'Red Hat OpenShift Dedicated';
      break;
    case 'azure':
      logoImg = openshiftLogoImg;
      productName = 'Azure Red Hat OpenShift';
      break;
    case 'rosa':
      logoImg = rosaLogoImg;
      productName = 'Red Hat OpenShift Service on AWS';
      break;
    default:
      logoImg = okdLogoImg;
      productName = 'OKD';
  }
  if (window.SERVER_FLAGS.customLogoURL) {
    logoImg = window.SERVER_FLAGS.customLogoURL;
  }
  if (window.SERVER_FLAGS.customProductName) {
    productName = window.SERVER_FLAGS.customProductName;
  }
  return { logoImg, productName };
};
