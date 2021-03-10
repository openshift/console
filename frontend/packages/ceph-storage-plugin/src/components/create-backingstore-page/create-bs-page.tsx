import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import { RouteComponentProps } from 'react-router';
import { Alert, AlertActionCloseButton, Title } from '@patternfly/react-core';
import { history } from '@console/internal/components/utils/router';
import { BreadCrumbs, resourcePathFromModel } from '@console/internal/components/utils';
import { k8sGet } from '@console/internal/module/k8s';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import CreateBackingStoreForm from './create-bs';
import './create-bs.scss';

const CreateBackingStoreFormPage: React.FC<CreateBackingStoreFormPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const [showHelp, setShowHelp] = React.useState(true);
  const [clusterServiceVersion, setClusterServiceVersion] = React.useState(null);
  const { ns, appName } = match.params;

  const onCancel = () => {
    history.goBack();
  };

  React.useEffect(() => {
    k8sGet(ClusterServiceVersionModel, appName, ns)
      .then((clusterServiceVersionObj) => {
        setClusterServiceVersion(clusterServiceVersionObj);
      })
      .catch(() => setClusterServiceVersion(null));
  }, [appName, ns]);

  return (
    <>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
          <BreadCrumbs
            breadcrumbs={[
              {
                name: _.get(
                  clusterServiceVersion,
                  'spec.displayName',
                  'Openshift Container Storage Operator',
                ),
                path: resourcePathFromModel(ClusterServiceVersionModel, appName, ns),
              },
              { name: t('ceph-storage-plugin~Create Backing Store'), path: match.url },
            ]}
          />
        </div>
        <div className="nb-bs-page-title">
          <Title size="2xl" headingLevel="h1" className="nb-bs-page-title__main">
            {t('ceph-storage-plugin~Create new Backing Store')}
          </Title>
          <p className="nb-bs-page-title__info">
            {t(
              'ceph-storage-plugin~Storage targets that are used to store chunks of data on Multicloud Object Gateway buckets.',
            )}
          </p>
        </div>
      </div>
      <div className="nb-bs-page">
        {showHelp && (
          <Alert
            isInline
            variant="info"
            title={t('ceph-storage-plugin~What is a Backing Store?')}
            actionClose={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
          >
            {t(
              'ceph-storage-plugin~A backing store represents a storage target to be used as the underlying storage layer in Multicloud Object Gateway buckets.',
            )}
            <br />
            {t(
              'ceph-storage-plugin~Multiple types of backing stores are supported: AWS S3 S3 Compatible Google Cloud Storage Azure Blob PVC.',
            )}
          </Alert>
        )}
        <CreateBackingStoreForm
          cancel={onCancel}
          isPage
          namespace={ns}
          className="nb-bs-page-form__short"
          csv={clusterServiceVersion}
        />
      </div>
    </>
  );
};

type CreateBackingStoreFormPageProps = RouteComponentProps<{ ns?: string; appName?: string }>;

export default CreateBackingStoreFormPage;
