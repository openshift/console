import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { StatusBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { BuildModel } from '../../models';
import { Build } from '../../types';
import EditBuild from './EditBuild';

const BuildFormPage: React.FC = () => {
  const { t } = useTranslation();
  const { ns: namespace, name } = useParams();

  const isNew = !name;

  const [watchedBuild, loaded, loadError] = useK8sWatchResource<Build>(
    isNew
      ? null
      : {
          groupVersionKind: {
            group: BuildModel.apiGroup,
            kind: BuildModel.kind,
            version: BuildModel.apiVersion,
          },
          name,
          namespace,
        },
  );
  const build: Build = isNew
    ? {
        apiVersion: 'shipwright.io/v1beta1',
        kind: 'Build',
        metadata: {
          namespace,
        },
        spec: {
          output: {
            image: '',
          },
          source: {
            git: {
              url: '',
              revision: '',
            },
            contextDir: '',
          },
          strategy: {
            name: '',
          },
        },
      }
    : watchedBuild;

  const title = isNew
    ? t('shipwright-plugin~Create Shipwright Build')
    : t('shipwright-plugin~Edit Shipwright Build');

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <StatusBox loaded={loaded} loadError={loadError} label={title} data={build}>
        <EditBuild heading={title} namespace={namespace} name={name} build={build} />
      </StatusBox>
    </>
  );
};

export default BuildFormPage;
