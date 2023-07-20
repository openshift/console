import { QuickStart } from '@patternfly/quickstarts';

export const quickStartSample: QuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'ConsoleQuickStart',
  metadata: { name: 'quickstart-sample' },
  spec: {
    displayName: 'QuickStart sample',
    description: '',
    icon: '',
  },
};

export const anotherQuickStartSample: QuickStart = {
  apiVersion: 'console.openshift.io/v1',
  kind: 'ConsoleQuickStart',
  metadata: { name: 'another-quickstart-sample' },
  spec: {
    displayName: 'QuickStart sample',
    description: '',
    icon: '',
  },
};

const getPseudoTranslatedQuickStart = (
  quickStart: QuickStart,
  lang?: string,
  country?: string,
): QuickStart => {
  return {
    ...quickStart,
    metadata: {
      ...quickStart.metadata,
      name: `${quickStart.metadata.name}${lang ? `-${lang}` : ''}${country ? `-${country}` : ''}`,
      labels: {
        ...quickStart.metadata.labels,
        'console.openshift.io/name': quickStart.metadata.name,
        'console.openshift.io/lang': lang,
        'console.openshift.io/country': country,
      },
    },
    spec: {
      ...quickStart.spec,
      displayName: `${quickStart.spec.displayName}${lang ? ` ${lang}` : ''}${
        country ? `-${country}` : ''
      }`,
    },
  };
};

export const translatedQuickStarts: QuickStart[] = [
  getPseudoTranslatedQuickStart(quickStartSample),
  getPseudoTranslatedQuickStart(quickStartSample, 'en', 'US'),
  getPseudoTranslatedQuickStart(quickStartSample, 'EN', 'CA'),
  getPseudoTranslatedQuickStart(quickStartSample, 'fr', 'CA'),
  getPseudoTranslatedQuickStart(quickStartSample, 'fr'),
  getPseudoTranslatedQuickStart(quickStartSample, 'de', 'DE'),
  getPseudoTranslatedQuickStart(quickStartSample, 'de', 'AT'),
];
