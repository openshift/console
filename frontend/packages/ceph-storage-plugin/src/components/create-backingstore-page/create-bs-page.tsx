import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { Alert, AlertActionCloseButton, Title } from '@patternfly/react-core';
import { history } from '@console/internal/components/utils/router';
import CreateBackingStoreForm from './create-bs';
import '../noobaa-provider-endpoints/noobaa-provider-endpoints.scss';

const CreateBackingStoreFormPage: React.FC<CreateBackingStoreFormPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const [showHelp, setShowHelp] = React.useState(true);
  const { ns, appName } = match.params;

  const onCancel = () => {
    history.goBack();
  };

  return (
    <>
      <div className="co-create-operand__header">
        <Title size="2xl" headingLevel="h1" className="co-create-operand__header-text">
          {t('ceph-storage-plugin~Create new BackingStore ')}
        </Title>
        <p className="help-block">
          {t(
            'ceph-storage-plugin~Storage targets that are used to store chunks of data on Multicloud Object Gateway buckets.',
          )}
        </p>
      </div>
      <div className="nb-endpoints-page">
        {showHelp && (
          <Alert
            isInline
            variant="info"
            title={t('ceph-storage-plugin~What is a BackingStore?')}
            actionClose={<AlertActionCloseButton onClose={() => setShowHelp(false)} />}
          >
            {t(
              'ceph-storage-plugin~A BackingStore represents a storage target to be used as the underlying storage layer in Multicloud Object Gateway buckets.',
            )}
            <br />
            {t(
              'ceph-storage-plugin~Multiple types of BackingStores are supported: AWS S3 S3 Compatible Google Cloud Storage Azure Blob PVC.',
            )}
          </Alert>
        )}
        <CreateBackingStoreForm
          cancel={onCancel}
          isPage
          namespace={ns}
          className="nb-endpoints-page-form__short"
          appName={appName}
        />
      </div>
    </>
  );
};

type CreateBackingStoreFormPageProps = RouteComponentProps<{ ns?: string; appName?: string }>;

export default CreateBackingStoreFormPage;
