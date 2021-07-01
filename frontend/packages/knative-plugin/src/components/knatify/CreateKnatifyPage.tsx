import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { deployValidationSchema } from '@console/dev-console/src/components/import/deployImage-validation-utils';
import { handleRedirect } from '@console/dev-console/src/components/import/import-submit-utils';
import { DeployImageFormData } from '@console/dev-console/src/components/import/import-types';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { LoadingBox, history, PageHeading } from '@console/internal/components/utils';
import {
  useK8sWatchResources,
  WatchK8sResults,
  WatchK8sResultsObject,
} from '@console/internal/components/utils/k8s-watch-hook';
import { ProjectModel, ServiceModel } from '@console/internal/models';
import { k8sGet, K8sResourceKind } from '@console/internal/module/k8s';
import { useExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import { BadgeType, getBadgeFromType, useActivePerspective, useRelatedHPA } from '@console/shared';
import {
  getInitialValuesKnatify,
  knatifyResources,
  getKnatifyWorkloadData,
} from '../../utils/knatify-utils';
import KnatifyForm from './KnatifyForm';

type watchResource = {
  [key: string]: K8sResourceKind[] | K8sResourceKind;
};

type CreateKnatifyPageProps = RouteComponentProps<{ ns?: string }>;

const CreateKnatifyPage: React.FunctionComponent<CreateKnatifyPageProps> = ({
  match,
  location,
}) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const queryParams = new URLSearchParams(location.search);
  const kind = queryParams.get('kind');
  const appName = queryParams.get('name');
  const apiVersion = queryParams.get('apiversion');
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const [hpa, hpaLoaded, hpaError] = useRelatedHPA(apiVersion, kind, appName, namespace);

  const watchedResources = React.useMemo(
    () => ({
      projects: {
        kind: ProjectModel.kind,
        isList: true,
      },
      imageStream: {
        kind: 'ImageStream',
        isList: true,
        namespace,
        selector: {
          matchLabels: { 'app.kubernetes.io/instance': appName },
        },
        optional: true,
      },
      ...(kind &&
        appName && {
          workloadResource: {
            kind,
            name: appName,
            namespace,
            optional: true,
          },
        }),
    }),
    [namespace, kind, appName],
  );

  const resources: WatchK8sResults<watchResource> = useK8sWatchResources<watchResource>(
    watchedResources,
  );

  const isResourceLoaded =
    Object.keys(resources).length > 0 &&
    Object.values(resources).every((value) => value.loaded || !!value.loadError) &&
    (hpaLoaded || !!hpaError);

  const handleSubmit = async (
    values: DeployImageFormData,
    helpers: FormikHelpers<DeployImageFormData>,
  ) => {
    try {
      const svcData = await k8sGet(ServiceModel, values.name, values.project.name);
      if (svcData) {
        helpers.setStatus({
          submitError: t(
            'knative-plugin~There is an existing placeholder Service with name {{name}} in namespace {{namespace}}. Please provide another name',
            {
              name: values.name,
              namespace: values.project.name,
            },
          ),
        });
      }
    } catch {
      const resourceActions = knatifyResources(values, appName, true).then(() =>
        knatifyResources(values, appName),
      );

      resourceActions
        .then(() => {
          helpers.setStatus({ submitError: '' });
          handleRedirect(namespace, perspective, perspectiveExtensions);
        })
        .catch((err) => {
          helpers.setStatus({ submitError: err.message });
        });
    }
  };

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('knative-plugin~Make Serverless')}</title>
      </Helmet>
      <PageHeading
        title={t('knative-plugin~Make Serverless')}
        badge={getBadgeFromType(BadgeType.TECH)}
      >
        {t(
          'knative-plugin~This feature will create a new serverless deployment next to your existing deployment. Other configurations, including the traffic pattern, can be modified in the form.',
        )}
      </PageHeading>
      {isResourceLoaded ? (
        <Formik
          initialValues={getInitialValuesKnatify(
            getKnatifyWorkloadData(resources?.workloadResource?.data as K8sResourceKind, hpa),
            namespace,
            resources?.imageStream?.data as K8sResourceKind[],
          )}
          validationSchema={deployValidationSchema(t)}
          onSubmit={handleSubmit}
          onReset={history.goBack}
        >
          {(formikProps) => (
            <KnatifyForm
              {...formikProps}
              projects={(resources?.projects as WatchK8sResultsObject<K8sResourceKind[]>) ?? {}}
            />
          )}
        </Formik>
      ) : (
        <LoadingBox />
      )}
    </NamespacedPage>
  );
};

export default CreateKnatifyPage;
