import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import {
  Kebab,
  navFactory,
  LoadingBox,
  LoadError,
  KebabAction,
} from '@console/internal/components/utils';
import { OperandDetails } from '@console/operator-lifecycle-manager/src/components/operand';
import { referenceForModel, nameForModel } from '@console/internal/module/k8s';
import { DetailsPage } from '@console/internal/components/factory';
import { ResourceEventStream } from '@console/internal/components/events';
import {
  ClusterServiceVersionModel,
  ClusterServiceVersionKind,
} from '@console/operator-lifecycle-manager';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { CEPH_STORAGE_NAMESPACE, NOOBAA_OPERATOR } from '../../constants';
import { NooBaaBucketClassModel } from '../../models';
import { editBucketClass } from '../bucket-class/modals/edit-backingstore-modal';

const csvResource = {
  kind: referenceForModel(ClusterServiceVersionModel),
  namespaced: true,
  namespace: CEPH_STORAGE_NAMESPACE,
  isList: true,
};

export const GenericDetailsPage: React.FC<GenericDetailsPageProps> = () => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const [model] = useK8sModel(params.resourceKind);

  const crdResource = React.useMemo(
    () => ({
      kind: CustomResourceDefinitionModel.kind,
      name: nameForModel(model),
      isList: false,
    }),
    [model],
  );

  const [csvItems, csvLoaded, csvError] = useK8sWatchResource<ClusterServiceVersionKind[]>(
    csvResource,
  );
  const [crd] = useK8sWatchResource(crdResource);

  const ocsCSV = csvLoaded
    ? csvItems?.find((item) => item.metadata.name.includes(NOOBAA_OPERATOR))
    : null;

  const isLoading = _.isEmpty(model) || _.isEmpty(crd) || _.isEmpty(csvItems);

  const actions = React.useMemo(() => {
    let commonActions = [...Kebab.factory.common];
    if (
      referenceForModel(NooBaaBucketClassModel).toLocaleLowerCase() ===
      params.resourceKind.toLocaleLowerCase()
    ) {
      const bucketClassActions = editBucketClass(t);
      commonActions = [bucketClassActions, ...commonActions];
    }
    return commonActions;
  }, [t, params.resourceKind]);

  if (csvError) {
    return <LoadError label={params.resourceKind} />;
  }

  return !isLoading ? (
    <DetailsPage
      name={params.resourceName}
      kind={params.resourceKind}
      namespace={CEPH_STORAGE_NAMESPACE}
      breadcrumbsFor={() => [
        {
          name: t('ceph-storage-plugin~OpenShift Data Foundation'),
          path: '/odf/overview',
        },
        {
          name: params.resourceKind,
          path: `/odf/resource/${params.resourceKind}`,
        },
        {
          name: t('ceph-storage-plugin~{{resource}} details', {
            resource: params.resourceName,
          }),
          path: `${location.pathname}`,
        },
      ]}
      pages={[
        navFactory.details((detailsProps) => (
          <OperandDetails
            {...detailsProps}
            appName={params.resourceName}
            kindObj={model}
            crd={crd}
            csv={ocsCSV}
          />
        )),
        navFactory.editYaml(),
        navFactory.events(ResourceEventStream),
      ]}
      menuActions={actions}
    />
  ) : (
    <LoadingBox />
  );
};

type GenericDetailsPageProps = {
  actions?: KebabAction[];
};
