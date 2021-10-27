import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { Title } from '@patternfly/react-core';
import { history } from '@console/internal/components/utils/router';
import { BreadCrumbs, resourcePathFromModel } from '@console/internal/components/utils';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src/models';
import { getName } from '@console/shared';
import { referenceForModel } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared/src/hooks/flag';
import NamespaceStoreForm from './namespace-store-form';
import '../noobaa-provider-endpoints/noobaa-provider-endpoints.scss';
import { NooBaaNamespaceStoreModel } from '../../models';
import { ODF_MODEL_FLAG, CEPH_STORAGE_NAMESPACE } from '../../constants';

const CreateNamespaceStore: React.FC<CreateNamespaceStoreProps> = ({ match }) => {
  const { t } = useTranslation();
  const { ns = CEPH_STORAGE_NAMESPACE, appName } = match.params;
  const onCancel = () => history.goBack();
  const isODF = useFlag(ODF_MODEL_FLAG);

  return (
    <>
      <div className="co-create-operand__breadcrumbs">
        <BreadCrumbs
          breadcrumbs={[
            {
              name: isODF ? 'OpenShift Data Foundation' : 'OpenShift Container Storage',
              path: isODF ? '/odf' : resourcePathFromModel(ClusterServiceVersionModel, appName, ns),
            },
            { name: t('ceph-storage-plugin~Create NamespaceStore '), path: match.url },
          ]}
        />
      </div>
      <div className="co-create-operand__header">
        <div className="nb-endpoints-page-title">
          <Title size="2xl" headingLevel="h1" className="nb-endpoints-page-title__main">
            {t('ceph-storage-plugin~Create NamespaceStore ')}
          </Title>
          <p className="nb-endpoints-page-title__info">
            {t(
              'ceph-storage-plugin~Represents an underlying storage to be used as read or write target for the data in the namespace buckets.',
            )}
          </p>
        </div>
      </div>
      <NamespaceStoreForm
        onCancel={onCancel}
        redirectHandler={(resources) => {
          const lastIndex = resources.length - 1;
          const resourcePath = `${referenceForModel(NooBaaNamespaceStoreModel)}/${getName(
            resources[lastIndex],
          )}`;
          isODF
            ? history.push(`/odf/resource/${resourcePath}`)
            : history.push(`/k8s/ns/${ns}/clusterserviceversions/${appName}/${resourcePath}`);
        }}
        namespace={ns}
        className="nb-endpoints-page-form__short"
      />
    </>
  );
};

type CreateNamespaceStoreProps = RouteComponentProps<{ ns: string; appName: string }>;

export default CreateNamespaceStore;
