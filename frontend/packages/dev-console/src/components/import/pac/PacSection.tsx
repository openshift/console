import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { GitProvider } from '@console/git-service/src';
import { Loading } from '@console/internal/components/utils';
import {
  usePacInfo,
  useRepositoryPresent,
} from '@console/pipelines-plugin/src/components/repository/hooks/pac-hook';
import { recommendRepositoryName } from '@console/pipelines-plugin/src/components/repository/repository-form-utils';
import ConfigTypeSection from '@console/pipelines-plugin/src/components/repository/sections/ConfigTypeSection';
import WebhookSection from '@console/pipelines-plugin/src/components/repository/sections/WebhookSection';
import './PacSection.scss';

const PacSection: React.FC = () => {
  const { t } = useTranslation();
  const formContextField = 'pac.repository';
  const [githubAppAvailable, setGithubAppAvailable] = React.useState(false);
  const { values, setFieldValue, errors, setFieldError } = useFormikContext<FormikValues>();
  const {
    git: { url, type },
  } = values;
  const [pac, loaded] = usePacInfo();
  const repoAlreadyExists = useRepositoryPresent(url);

  React.useEffect(() => {
    if (loaded && !!pac && pac.data['app-link']) {
      setGithubAppAvailable(true);
      setFieldValue('pac.repository.githubAppAvailable', true);
    }
  }, [pac, loaded, setFieldValue]);

  React.useEffect(() => {
    setFieldValue('pac.repository.gitUrl', url);
    setFieldValue('name', recommendRepositoryName(url));
    setFieldValue('pac.repository.gitProvider', type);
  }, [setFieldValue, url, type]);

  React.useEffect(() => {
    setFieldValue('pac.repository.name', values.name);
  }, [setFieldValue, values.name]);

  React.useEffect(() => {
    if (repoAlreadyExists) {
      setFieldError('pac.pacHasError', 'Repository with same URL already exists');
    }
  }, [setFieldError, repoAlreadyExists, errors]);

  if (repoAlreadyExists) {
    return (
      <FormSection>
        <Alert
          className="odc-pac-strategy-section__error-alert"
          isInline
          variant="danger"
          title={t('devconsole~Import is not possible.')}
        >
          {t(
            'devconsole~Repository with same URL already exists. Please update the Repository URL or change the Build Strategy to continue.',
          )}
        </Alert>
      </FormSection>
    );
  }

  return pac ? (
    githubAppAvailable && type === GitProvider.GITHUB ? (
      <div className="odc-pac-strategy-section__config-type">
        <ConfigTypeSection pac={pac} formContextField={formContextField} />
      </div>
    ) : (
      <WebhookSection pac={pac} formContextField={formContextField} />
    )
  ) : (
    <Loading />
  );
};

export default PacSection;
