import * as React from 'react';
import * as _ from 'lodash';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { AlertVariant } from '@patternfly/react-core';
import { useExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import {
  ALL_APPLICATIONS_KEY,
  getOwnedResources,
  useActivePerspective,
  useToast,
  useBeforeUnloadWatchResource,
} from '@console/shared/src';
import {
  useK8sWatchResource,
  WatchK8sResource,
  WatchK8sResultsObject,
} from '@console/internal/components/utils/k8s-watch-hook';
import { history, resourcePathFromModel } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { sanitizeApplicationValue } from '@console/topology/src/utils';
import { BuildModel, BuildConfigModel } from '@console/internal/models';
import { Resources, UploadJarFormData } from '../import-types';
import { healthChecksProbeInitialData } from '../../health-checks/health-checks-probe-utils';
import UploadJarForm from './UploadJarForm';
import { BuilderImage } from '../../../utils/imagestream-utils';
import { createOrUpdateJarFile } from '../upload-jar-submit-utils';
import { handleRedirect } from '../import-submit-utils';
import { validationSchema } from '../upload-jar-validation-utils';

export type UploadJarProps = {
  namespace: string;
  projects: WatchK8sResultsObject<K8sResourceKind[]>;
  builderImage: BuilderImage;
  forApplication?: string;
};
const UploadJar: React.FunctionComponent<UploadJarProps> = ({
  namespace,
  projects,
  forApplication,
  builderImage,
}) => {
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const toastContext = useToast();
  const beforeUnloadWatchResourceContext = useBeforeUnloadWatchResource();
  const buildsResource: WatchK8sResource = {
    kind: BuildModel.kind,
    namespace,
    isList: true,
  };
  const [builds] = useK8sWatchResource<K8sResourceKind[]>(buildsResource);

  const application = forApplication || '';
  const activeApplication = application !== ALL_APPLICATIONS_KEY ? application : '';
  const { name: imageName, recentTag: tag } = builderImage;

  const initialValues: UploadJarFormData = {
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
    application: {
      initial: sanitizeApplicationValue(activeApplication),
      name: sanitizeApplicationValue(activeApplication),
      selectedKey: activeApplication,
      isInContext: !!sanitizeApplicationValue(activeApplication),
    },
    name: '',
    fileUpload: {
      name: '',
      value: '',
      javaArgs: '',
    },
    runtimeIcon: 'java',
    image: {
      selected: imageName,
      recommended: '',
      tag: tag.name,
      tagObj: tag,
      ports: [],
      isRecommending: false,
      couldNotRecommend: false,
    },
    serverless: {
      scaling: {
        minpods: '',
        maxpods: '',
        concurrencytarget: '',
        concurrencylimit: '',
        autoscale: {
          autoscalewindow: '',
          autoscalewindowUnit: '',
          defaultAutoscalewindowUnit: 's',
        },
        concurrencyutilization: '',
      },
    },
    route: {
      disable: false,
      create: true,
      targetPort: '',
      unknownTargetPort: '',
      defaultUnknownPort: 8080,
      path: '',
      hostname: '',
      secure: false,
      tls: {
        termination: '',
        insecureEdgeTerminationPolicy: '',
        caCertificate: '',
        certificate: '',
        destinationCACertificate: '',
        privateKey: '',
      },
    },
    resources: Resources.Kubernetes,
    build: {
      env: [],
      triggers: {},
      strategy: 'Source',
    },
    deployment: {
      env: [],
      triggers: {
        image: true,
        config: true,
      },
      replicas: 1,
    },
    labels: {},
    limits: {
      cpu: {
        request: '',
        requestUnit: 'm',
        defaultRequestUnit: 'm',
        limit: '',
        limitUnit: 'm',
        defaultLimitUnit: 'm',
      },
      memory: {
        request: '',
        requestUnit: 'Mi',
        defaultRequestUnit: 'Mi',
        limit: '',
        limitUnit: 'Mi',
        defaultLimitUnit: 'Mi',
      },
    },
    healthChecks: healthChecksProbeInitialData,
  };

  const handleSubmit = (values, actions) => {
    const imageStream = builderImage?.obj;
    const createNewProject = projects.loaded && _.isEmpty(projects.data);
    const {
      project: { name: projectName },
    } = values;

    const resourceActions = createOrUpdateJarFile(
      values,
      imageStream,
      createNewProject,
      true,
    ).then(() => createOrUpdateJarFile(values, imageStream));

    return resourceActions
      .then((resp) => {
        const createdBuildConfig = resp.find((d) => d.kind === BuildConfigModel.kind);
        const ownBuilds = getOwnedResources(createdBuildConfig, builds);
        const buildName = `${createdBuildConfig.metadata.name}-${ownBuilds.length + 1}`;
        const link = `${resourcePathFromModel(BuildModel, buildName, namespace)}/logs`;
        beforeUnloadWatchResourceContext.watchResource(
          {
            kind: BuildModel.kind,
            name: buildName,
            namespace,
          },
          (resData: K8sResourceKind) =>
            ['New', 'Pending', 'Running'].includes(resData.status?.phase),
        );
        toastContext.addToast({
          variant: AlertVariant.info,
          title: t('devconsole~JAR file uploading'),
          content: t(
            'devconsole~JAR file is uploading to {{namespace}}. You can view the upload progress in the build logs. This may take a few minutes. If you exit the browser while upload is in progress it may fail.',
            {
              namespace,
            },
          ),
          timeout: true,
          actions: [
            {
              dismiss: true,
              label: t('devconsole~View build logs'),
              callback: () => history.push(link),
            },
          ],
        });
        handleRedirect(projectName, perspective, perspectiveExtensions);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={validationSchema(t)}
    >
      {(formikProps) => (
        <UploadJarForm
          {...formikProps}
          namespace={namespace}
          projects={projects}
          builderImage={builderImage}
        />
      )}
    </Formik>
  );
};

export default UploadJar;
