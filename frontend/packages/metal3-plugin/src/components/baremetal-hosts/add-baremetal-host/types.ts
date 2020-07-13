export type AddBareMetalHostFormValues = {
  name: string;
  BMCAddress: string;
  username: string;
  password: string;
  disableCertificateVerification: boolean;
  bootMACAddress: string;
  online: boolean;
  description: string;
  enablePowerManagement: boolean;
};
