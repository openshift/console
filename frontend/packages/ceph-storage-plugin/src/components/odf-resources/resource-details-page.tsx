import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { Kebab, navFactory, LoadingBox, LoadError } from '@console/internal/components/utils';
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
import { CEPH_STORAGE_NAMESPACE, OCS_OPERATOR } from '../../constants';

const csvResource = {
  kind: referenceForModel(ClusterServiceVersionModel),
  namespaced: true,
  namespace: CEPH_STORAGE_NAMESPACE,
  isList: true,
};

export const GenericDetailsPage: React.FC<GenericDetailsPageProps> = (props) => {
  const { t } = useTranslation();
  const [model] = useK8sModel(props.match.params.resourceKind);

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
    ? csvItems?.find((item) => item.metadata.name.includes(OCS_OPERATOR))
    : null;

  const isLoading = _.isEmpty(model) || _.isEmpty(crd) || _.isEmpty(csvItems);

  if (csvError) {
    return <LoadError label={props.match.params.resourceKind} />;
  }

  return !isLoading ? (
    <DetailsPage
      match={props.match}
      name={props.match.params.resourceName}
      kind={props.match.params.resourceKind}
      namespace={CEPH_STORAGE_NAMESPACE}
      breadcrumbsFor={() => [
        {
          name: t('ceph-storage-plugin~OpenShift Data Foundation'),
          path: '/odf/overview',
        },
        {
          name: props.match.params.resourceKind,
          path: `/odf/resource/${props.match.params.resourceKind}`,
        },
        {
          name: t('ceph-storage-plugin~{{resource}} details', {
            resource: props.match.params.resourceName,
          }),
          path: `${props.match.url}`,
        },
      ]}
      pages={[
        navFactory.details((detailsProps) => (
          <OperandDetails
            {...detailsProps}
            appName={props.match.params.resourceName}
            kindObj={model}
            crd={crd}
            csv={ocsCSV}
          />
        )),
        navFactory.editYaml(),
        navFactory.events(ResourceEventStream),
      ]}
      menuActions={Kebab.factory.common}
    />
  ) : (
    <LoadingBox />
  );
};

type GenericDetailsPageProps = RouteComponentProps<{ resourceKind: string; resourceName: string }>;
