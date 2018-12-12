const getProductName = () => {
  switch ((window as any).SERVER_FLAGS.branding) {
    case 'openshift':
      return 'OpenShift';
    case 'ocp':
      return 'OpenShift Container Platform';
    case 'online':
      return 'OpenShift Online';
    case 'okdvirt':
      return 'OKD Virtualization';
    default:
      return 'OKD';
  }
};
export const productName = getProductName();
