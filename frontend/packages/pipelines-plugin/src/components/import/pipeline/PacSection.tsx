import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { GitProvider } from '@console/git-service/src';
import { ExpandCollapse, Loading } from '@console/internal/components/utils';
import { usePacInfo } from '@console/pipelines-plugin/src/components/repository/hooks/pac-hook';
import { recommendRepositoryName } from '@console/pipelines-plugin/src/components/repository/repository-form-utils';
import ConfigTypeSection from '@console/pipelines-plugin/src/components/repository/sections/ConfigTypeSection';
import WebhookSection from '@console/pipelines-plugin/src/components/repository/sections/WebhookSection';
import { PacConfigurationTypes } from '../../repository/consts';
import InfoPanel from './PacInfoPanel';
import './PacSection.scss';

const PacSection: React.FC = () => {
  const { t } = useTranslation();
  const formContextField = 'pac.repository';
  const [githubAppAvailable, setGithubAppAvailable] = React.useState(false);
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const {
    git: { url, type },
  } = values;
  const [pac, loaded] = usePacInfo();

  React.useEffect(() => {
    if (loaded && !!pac && pac.data['app-link']) {
      setGithubAppAvailable(true);
      setFieldValue('pac.repository.githubAppAvailable', true);
      setFieldValue('pac.repository.method', PacConfigurationTypes.GITHUB);
    } else {
      setFieldValue('pac.repository.method', PacConfigurationTypes.WEBHOOK);
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

  return pac ? (
    <>
      <ExpandCollapse
        textCollapsed={t('pipelines-plugin~View details')}
        textExpanded={t('pipelines-plugin~Hide details')}
      >
        <InfoPanel />
      </ExpandCollapse>

      {githubAppAvailable && type === GitProvider.GITHUB ? (
        <div className="odc-pipeline-section-pac__config-type">
          <ConfigTypeSection pac={pac} formContextField={formContextField} />
        </div>
      ) : (
        <WebhookSection pac={pac} formContextField={formContextField} />
      )}
    </>
  ) : (
    <Loading />
  );
};

export default PacSection;
