import type { FC } from 'react';
import { useState, useEffect } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { GitProvider } from '@console/git-service/src';
import { ExpandCollapse, Loading } from '@console/internal/components/utils';
import ConfigTypeSection from './ConfigTypeSection';
import { usePacInfo } from './pac-hook';
import InfoPanel from './PacInfoPanel';
import { recommendRepositoryName } from './utils';
import WebhookSection from './WebhookSection';
import './PacSection.scss';

export enum PacConfigurationTypes {
  GITHUB = 'github',
  WEBHOOK = 'webhook',
}

const PacSection: FC = () => {
  const { t } = useTranslation();
  const formContextField = 'pac.repository';
  const [githubAppAvailable, setGithubAppAvailable] = useState(false);
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const {
    git: { url, type },
  } = values;
  const [pac, loaded] = usePacInfo();

  useEffect(() => {
    if (loaded && !!pac && pac.data?.['app-link']) {
      setGithubAppAvailable(true);
      setFieldValue('pac.repository.githubAppAvailable', true);
      setFieldValue('pac.repository.method', PacConfigurationTypes.GITHUB);
    } else {
      setFieldValue('pac.repository.method', PacConfigurationTypes.WEBHOOK);
    }
  }, [pac, loaded, setFieldValue]);

  useEffect(() => {
    setFieldValue('pac.repository.gitUrl', url);
    setFieldValue('name', recommendRepositoryName(url));
    setFieldValue('pac.repository.gitProvider', type);
  }, [setFieldValue, url, type]);

  useEffect(() => {
    setFieldValue('pac.repository.name', values.name);
  }, [setFieldValue, values.name]);

  return pac ? (
    <>
      <ExpandCollapse
        textCollapsed={t('devconsole~View details')}
        textExpanded={t('devconsole~Hide details')}
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
