// Annotation for human readable chart name, ready to be displayed in UI
export const CHART_NAME_ANNOTATION = 'charts.openshift.io/name';
// Annotation for chart category, e.g. redhat, partner, community
export const PROVIDER_TYPE_ANNOTATION = 'charts.openshift.io/providerType';
// Annotation for provider name, e.g. Fortanix, HashiCorp, etc
export const PROVIDER_NAME_ANNOTATION = 'charts.openshift.io/provider';

export enum PROVIDER_TYPE {
  redhat = 'redhat',
  partner = 'partner',
  community = 'community',
}

export const PROVIDER_TYPE_KEYS = {
  // t('helm-plugin~Community')
  community: 'helm-plugin~Community',
  // t('helm-plugin~Partner')
  partner: 'helm-plugin~Partner',
  // t('helm-plugin~Red Hat')
  redhat: 'helm-plugin~Red Hat',
};
