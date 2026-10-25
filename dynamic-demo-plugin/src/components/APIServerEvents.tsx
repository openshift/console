import {
  useK8sWatchResource,
  WatchK8sResource,
  ResourceEventStream,
  K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import { PageSection, Title } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

const apiServerResource: WatchK8sResource = {
  kind: 'Deployment',
  namespace: 'openshift-apiserver',
  name: 'apiserver',
  isList: false,
};

const APIServerEvents: React.FC = () => {
  const [object, loaded, loadError] = useK8sWatchResource<K8sResourceCommon>(apiServerResource);
  const { t } = useTranslation('plugin__console-demo-plugin');

  return (
    <>
      <PageSection>
        <Title headingLevel="h1">{t('API Server Events')}</Title>
      </PageSection>
      <PageSection>
        {loaded && !loadError && <ResourceEventStream resource={object} />}
      </PageSection>
    </>
  );
};

export default APIServerEvents;
