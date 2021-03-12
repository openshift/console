import * as React from 'react';
import * as _ from 'lodash';
import { Formik, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { AlertVariant } from '@patternfly/react-core';
import { useExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import {
  ALL_APPLICATIONS_KEY,
  getOwnedResources,
  useActivePerspective,
  useToast,
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
import { BaseFormData, UploadJarFormData } from '../import-types';
import UploadJarForm from './UploadJarForm';
import { BuilderImage } from '../../../utils/imagestream-utils';
import { createOrUpdateJarFile } from '../upload-jar-submit-utils';
import { handleRedirect } from '../import-submit-utils';
import { validationSchema } from '../upload-jar-validation-utils';
import { getBaseInitialValues } from '../form-initial-values';

type UploadJarProps = {
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
  const buildsResource: WatchK8sResource = {
    kind: BuildModel.kind,
    namespace,
    isList: true,
  };
  const [builds] = useK8sWatchResource<K8sResourceKind[]>(buildsResource);

  const application = forApplication || '';
  const activeApplication = application !== ALL_APPLICATIONS_KEY ? application : '';
  const { name: imageName, recentTag: tag } = builderImage;

  const initialBaseValues: BaseFormData = getBaseInitialValues(namespace, activeApplication);
  const initialValues: UploadJarFormData = {
    ...initialBaseValues,
    application: {
      ...initialBaseValues.application,
      isInContext: !!sanitizeApplicationValue(activeApplication),
    },
    fileUpload: {
      name: '',
      value: '',
      javaArgs: '',
    },
    runtimeIcon: 'java',
    image: {
      ...initialBaseValues.image,
      selected: imageName,
      tag: tag.name,
      tagObj: tag,
    },
  };

  const handleSubmit = (values: UploadJarFormData, actions: FormikHelpers<UploadJarFormData>) => {
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
