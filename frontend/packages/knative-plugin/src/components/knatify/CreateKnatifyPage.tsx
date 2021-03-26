import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { RouteComponentProps } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { BadgeType, getBadgeFromType, useActivePerspective, useRelatedHPA } from '@console/shared';
import { useExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import { ProjectModel } from '@console/internal/models';
import { LoadingBox, history, PageHeading } from '@console/internal/components/utils';
import {
  useK8sWatchResources,
  WatchK8sResults,
  WatchK8sResultsObject,
} from '@console/internal/components/utils/k8s-watch-hook';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { handleRedirect } from '@console/dev-console/src/components/import/import-submit-utils';
import { DeployImageFormData } from '@console/dev-console/src/components/import/import-types';
import { deployValidationSchema } from '@console/dev-console/src/components/import/deployImage-validation-utils';
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

  const handleSubmit = (
    values: DeployImageFormData,
    helpers: FormikHelpers<DeployImageFormData>,
  ) => {
    return knatifyResources(values)
      .then(() => {
        helpers.setStatus({ submitError: '' });
        handleRedirect(namespace, perspective, perspectiveExtensions);
      })
      .catch((err) => {
        helpers.setStatus({ submitError: err.message });
      });
  };

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('knative-plugin~Create Knative service')}</title>
      </Helmet>
      <PageHeading
        title={t('knative-plugin~Create Knative service')}
        badge={getBadgeFromType(BadgeType.TECH)}
      />
      {isResourceLoaded ? (
        <Formik
          initialValues={getInitialValuesKnatify(
            getKnatifyWorkloadData(resources?.workloadResource?.data as K8sResourceKind, hpa),
            appName,
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
