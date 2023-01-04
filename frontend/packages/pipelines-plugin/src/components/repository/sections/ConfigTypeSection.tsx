import * as React from 'react';
import { FormGroup, Flex, FlexItem, Tile, Text } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { ConfigMapKind } from 'public/module/k8s/types';
import { PacConfigurationTypes } from '../consts';
import { RepositoryFormValues } from '../types';
import GithubSection from './GithubSection';
import WebhookSection from './WebhookSection';

type ConfigTypeSectionProps = {
  pac: ConfigMapKind;
  formContextField?: string;
};

const ConfigTypeSection: React.FC<ConfigTypeSectionProps> = ({ pac, formContextField }) => {
  const { values, setFieldValue } = useFormikContext<FormikValues & RepositoryFormValues>();
  const fieldPrefix = formContextField ? `${formContextField}.` : '';
  const { method } = _.get(values, formContextField) || values;
  const { t } = useTranslation();

  return (
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
                onClick={() => setFieldValue(`${fieldPrefix}method`, PacConfigurationTypes.GITHUB)}
                isSelected={method === PacConfigurationTypes.GITHUB}
              />
            </FlexItem>
            <FlexItem span={3}>
              <Tile
                data-test="webhook"
                title={t('pipelines-plugin~Setup a webhook')}
                onClick={() => setFieldValue(`${fieldPrefix}method`, PacConfigurationTypes.WEBHOOK)}
                isSelected={method === PacConfigurationTypes.WEBHOOK}
              />
            </FlexItem>
          </Flex>
        </FormGroup>
      </FormSection>
      <FormSection fullWidth={method === PacConfigurationTypes.WEBHOOK || !fieldPrefix}>
        {method === PacConfigurationTypes.GITHUB && <GithubSection pac={pac} />}
        {method === PacConfigurationTypes.WEBHOOK && (
          <WebhookSection pac={pac} formContextField={formContextField} />
        )}
      </FormSection>
    </>
  );
};

export default ConfigTypeSection;
