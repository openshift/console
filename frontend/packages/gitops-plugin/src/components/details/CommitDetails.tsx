import * as React from 'react';
import { Label, Split, SplitItem } from '@patternfly/react-core';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { LoadingInline, Timestamp } from '@console/internal/components/utils';
import { ImageStreamImportsModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s';
import { getActiveNamespace } from '@console/internal/reducers/ui';
import { CommitData } from '../utils/gitops-types';
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
          <Split className="odc-gitops-commit">
            <SplitItem isFilled>
              <Label className="odc-gitops-commit__item" isTruncated>
                <Timestamp timestamp={commitData.timestamp} />
              </Label>
            </SplitItem>
          </Split>
          <Split className="odc-gitops-commit">
            <SplitItem isFilled>
              <Label className="odc-gitops-commit__item" isTruncated>
                {commitData.id}
              </Label>
            </SplitItem>
          </Split>
          <Split className="odc-gitops-commit">
            <SplitItem isFilled>
              <Label className="odc-gitops-commit__item" isTruncated>
                {commitData.msg}
              </Label>
            </SplitItem>
          </Split>
          <Split className="odc-gitops-commit">
            <SplitItem isFilled>
              <Label className="odc-gitops-commit__item" isTruncated>
                {t('gitops-plugin~by {{author}}', { author: commitData.author })}
              </Label>
            </SplitItem>
          </Split>
        </>
      ) : (
        <span>{t('gitops-plugin~Commit details not available')}</span>
      )}
    </>
  );
};

export default CommitDetails;
