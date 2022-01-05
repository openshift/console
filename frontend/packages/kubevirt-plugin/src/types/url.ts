export type VMWizardInitialData = {
  name?: string;
  startVM?: boolean;
  source?: VMWizardBootSourceParams;
  commonTemplateName?: string;
  userTemplateName?: string;
  userTemplateNs?: string;
  storageClass?: string;
  accessMode?: string;
  volumeMode?: string;
};

export type VMWizardBootSourceParams = {
  cdRom: boolean;
  size: string;
  url?: string;
  pvcName?: string;
  pvcNamespace?: string;
  container?: string;
};
