import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { k8sCreate } from '@console/internal/module/k8s';
import { ImageStreamImportsModel } from '@console/internal/models';
import { LoadingInline } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { CommitData } from '../utils/gitops-types';
import { Label } from '@patternfly/react-core';
import { routeDecoratorIcon } from '@console/dev-console/src/components/import/render-utils';
import './CommitDetails.scss';

interface CommitDetailsProps {
  imageName: string;
}

const CommitDetails: React.FC<CommitDetailsProps> = ({ imageName }) => {
  const [commitData, setCommitData] = React.useState<CommitData>(null);
  const namespace = useSelector(getActiveNamespace);
  const { t } = useTranslation();
  const importImage = imageName && {
    kind: 'ImageStreamImport',
    apiVersion: 'image.openshift.io/v1',
    metadata: {
      name: 'gitops-app',
      namespace,
    },
    spec: {
      import: false,
      images: [
        {
          from: {
            kind: 'DockerImage',
            name: _.trim(imageName),
          },
          importPolicy: { insecure: true },
        },
      ],
    },
    status: {},
  };

  React.useEffect(() => {
    let ignore = false;

    const getCommitData = async () => {
      let lastCommitData: CommitData = { author: '', timestamp: '', id: '', msg: '', ref: '' };
      let imageStreamImport;
      try {
        imageStreamImport = importImage
          ? await k8sCreate(ImageStreamImportsModel, importImage)
          : {};
      } catch {} // eslint-disable-line no-empty
      if (ignore) return;
      const status = imageStreamImport?.status?.images?.[0]?.status;
      if (status?.status === 'Success') {
        const imageLabels =
          imageStreamImport?.status?.images?.[0]?.image?.dockerImageMetadata?.Config?.Labels;
        lastCommitData = {
          author: imageLabels?.['io.openshift.build.commit.author'],
          timestamp: imageLabels?.['io.openshift.build.commit.date'],
          id: imageLabels?.['io.openshift.build.commit.id'],
          msg: imageLabels?.['io.openshift.build.commit.message'],
          ref: imageLabels?.['io.openshift.build.commit.ref'],
        };
      }
      setCommitData(lastCommitData);
    };

    getCommitData();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!commitData) return <LoadingInline />;

  return (
    <>
      {commitData.id ? (
        <>
          <div>
            <strong>{commitData.id}</strong>
            {commitData.msg}
          </div>
          <div className="odc-gitops-commit__commit-author-sha">
            {t('gitops-plugin~by {{author}}', { author: commitData.author })}{' '}
            <Label
              className="odc-gitops-commit__commit-label"
              color="blue"
              icon={routeDecoratorIcon('https://www.github.com/reginapizza/taxi', 12, t)}
              variant="outline"
            >
              {commitData.ref}
            </Label>
          </div>
        </>
      ) : (
        <span>{t('gitops-plugin~Commit details not available')}</span>
      )}
    </>
  );
};

export default CommitDetails;
