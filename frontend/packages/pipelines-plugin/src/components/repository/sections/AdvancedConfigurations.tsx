import * as React from 'react';
import { ExpandableSection, FormGroup, Flex, FlexItem, Tile, Text } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { GitProvider } from '@console/git-service';
import { PacConfigurationTypes } from '../consts';
import { usePacInfo } from '../hooks/pac-hook';
import { RepositoryFormValues } from '../types';
import GithubSection from './GithubSection';
import WebhookSection from './WebhookSection';

const AdvancedConfigurations = () => {
  const [githubAppAvailable, setGithubAppAvailable] = React.useState(false);
  const { t } = useTranslation();
  const [pac, loaded] = usePacInfo();

  React.useEffect(() => {
    if (loaded && !!pac && pac.data['app-link']) {
      setGithubAppAvailable(true);
    }
  }, [pac, loaded]);

  const { values, setFieldValue } = useFormikContext<RepositoryFormValues>();

  return (
    <ExpandableSection
      toggleTextExpanded={t('pipelines-plugin~Hide configuration options')}
      toggleTextCollapsed={t('pipelines-plugin~Show configuration options')}
    >
      {githubAppAvailable && values.gitProvider === GitProvider.GITHUB ? (
        <>
          <Text>
            {t(
              'pipelines-plugin~A GitHub App is already set up for this cluster. To use it, install the GitHub app on your personal account or GitHub organization.',
            )}
          </Text>
          <br />
          <FormSection extraMargin>
            <FormGroup fieldId="method">
              <Flex>
                <FlexItem span={3}>
                  <Tile
                    data-test="github"
                    title={t('pipelines-plugin~Use GitHub App')}
                    onClick={() => setFieldValue('method', PacConfigurationTypes.GITHUB)}
                    isSelected={values.method === PacConfigurationTypes.GITHUB}
                  />
                </FlexItem>
                <FlexItem span={3}>
                  <Tile
                    data-test="webhook"
                    title={t('pipelines-plugin~Setup a webhook')}
                    onClick={() => setFieldValue('method', PacConfigurationTypes.WEBHOOK)}
                    isSelected={values.method === PacConfigurationTypes.WEBHOOK}
                  />
                </FlexItem>
              </Flex>
            </FormGroup>
          </FormSection>
          <FormSection>
            {values.method === PacConfigurationTypes.GITHUB && <GithubSection pac={pac} />}
            {values.method === PacConfigurationTypes.WEBHOOK && <WebhookSection pac={pac} />}
          </FormSection>
        </>
      ) : (
        <WebhookSection pac={pac} />
      )}
    </ExpandableSection>
  );
};

export default AdvancedConfigurations;
