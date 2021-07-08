import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { StatusBox } from '@console/internal/components/utils';
import {
  useK8sWatchResource,
  useK8sWatchResources,
  WatchK8sResults,
  WatchK8sResultsObject,
} from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/knative-plugin';
import { PipelineModel } from '@console/pipelines-plugin/src/models';
import { PipelineKind } from '@console/pipelines-plugin/src/types';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import EditApplicationComponent from './EditApplicationComponent';

type WatchResource = {
  [key: string]: K8sResourceKind[] | K8sResourceKind | PipelineKind[];
};

type EditApplicationPageProps = RouteComponentProps<{ ns?: string }>;

const EditApplicationPage: React.FunctionComponent<EditApplicationPageProps> = ({
  match,
  location,
}) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const queryParams = new URLSearchParams(location.search);
  const editAppResourceKind = queryParams.get('kind');
  const appName = queryParams.get('name');
  let kind = editAppResourceKind;
  if (kind === ServiceModel.kind) {
    kind = referenceForModel(ServiceModel);
  }

  const watchedEditResource = React.useMemo(
    () => ({
      kind,
      name: appName,
      namespace,
      optional: true,
    }),
    [kind, appName, namespace],
  );

  const [editResData, isEditResDataLoaded, editResDataLoadError] = useK8sWatchResource<
    K8sResourceKind
  >(watchedEditResource);

  const watchedResources = React.useMemo(() => {
    const NAME_LABEL = 'app.kubernetes.io/name';
    const nameLabel =
      isEditResDataLoaded &&
      !editResDataLoadError &&
      (editResData?.metadata?.labels?.[NAME_LABEL] || appName);
    return {
      service: {
        kind: 'Service',
        name: appName,
        namespace,
        optional: true,
      },
      route: {
        kind: 'Route',
        prop: 'route',
        name: appName,
        namespace,
        optional: true,
      },
      buildConfig: {
        kind: 'BuildConfig',
        isList: true,
        namespace,
        selector: {
          matchLabels: { [NAME_LABEL]: nameLabel },
        },
        optional: true,
      },
      [PipelineModel.id]: {
        kind: referenceForModel(PipelineModel),
        isList: true,
        namespace,
        selector: {
          matchLabels: { [NAME_LABEL]: nameLabel },
        },
        optional: true,
      },
      imageStream: {
        kind: 'ImageStream',
        isList: true,
        namespace,
        selector: {
          matchLabels: { [NAME_LABEL]: nameLabel },
        },
        optional: true,
      },
      imageStreams: {
        kind: 'ImageStream',
        prop: 'imageStreams',
        isList: true,
        namespace: 'openshift',
        optional: true,
      },
    };
  }, [namespace, appName, editResData, isEditResDataLoaded, editResDataLoadError]);

  const resources: WatchK8sResults<WatchResource> = useK8sWatchResources<WatchResource>(
    watchedResources,
  );

  const isResourcesLoaded =
    Object.keys(resources).length > 0 &&
    Object.values(resources).every((value) => value.loaded || !!value.loadError) &&
    (isEditResDataLoaded || !!editResDataLoadError);

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('devconsole~Edit')}</title>
      </Helmet>
      <StatusBox loaded={isResourcesLoaded} data={editResData}>
        <EditApplicationComponent
          namespace={namespace}
          appName={appName}
          resources={{
            ...resources,
            editAppResource: {
              data: editResData,
              loaded: isEditResDataLoaded,
              loadError: editResDataLoadError,
            },
            pipeline: resources.pipeline as WatchK8sResultsObject<PipelineKind[]>,
          }}
        />
      </StatusBox>
    </NamespacedPage>
  );
};

export default EditApplicationPage;
