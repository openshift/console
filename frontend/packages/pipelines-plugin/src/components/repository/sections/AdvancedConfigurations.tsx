import * as React from 'react';
import { ExpandableSection } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { GitProvider } from '@console/git-service';
import { usePacInfo } from '../hooks/pac-hook';
import { RepositoryFormValues } from '../types';
import ConfigTypeSection from './ConfigTypeSection';
import WebhookSection from './WebhookSection';

const AdvancedConfigurations = () => {
  const [githubAppAvailable, setGithubAppAvailable] = React.useState(false);
  const { values, setFieldValue } = useFormikContext<RepositoryFormValues>();
  const { t } = useTranslation();
  const [pac, loaded] = usePacInfo();

  React.useEffect(() => {
    if (loaded && !!pac && pac.data['app-link']) {
      setGithubAppAvailable(true);
      setFieldValue('githubAppAvailable', true);
    }
  }, [pac, loaded, setFieldValue]);

  return (
    <ExpandableSection
      toggleTextExpanded={t('pipelines-plugin~Hide configuration options')}
      toggleTextCollapsed={t('pipelines-plugin~Show configuration options')}
    >
      {githubAppAvailable && values.gitProvider === GitProvider.GITHUB ? (
        <ConfigTypeSection pac={pac} />
      ) : (
        <WebhookSection pac={pac} />
      )}
    </ExpandableSection>
  );
};

export default AdvancedConfigurations;
