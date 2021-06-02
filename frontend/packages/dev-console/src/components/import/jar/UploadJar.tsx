import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { history } from '@console/internal/components/utils';
import { WatchK8sResultsObject } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import {
  ALL_APPLICATIONS_KEY,
  useActivePerspective,
  usePostFormSubmitAction,
} from '@console/shared/src';
import { sanitizeApplicationValue } from '@console/topology/src/utils';
import { BuilderImage } from '../../../utils/imagestream-utils';
import { getBaseInitialValues } from '../form-initial-values';
import { handleRedirect } from '../import-submit-utils';
import { BaseFormData, Resources, UploadJarFormData } from '../import-types';
import { createOrUpdateJarFile } from '../upload-jar-submit-utils';
import { validationSchema } from '../upload-jar-validation-utils';
import UploadJarForm from './UploadJarForm';
import { useUploadJarFormToast } from './useUploadJarFormToast';

type UploadJarProps = {
  namespace: string;
  projects: WatchK8sResultsObject<K8sResourceKind[]>;
  builderImage: BuilderImage;
  forApplication?: string;
  contextualSource?: string;
};

const UploadJar: React.FunctionComponent<UploadJarProps> = ({
  namespace,
  projects,
  builderImage,
  forApplication,
  contextualSource,
}) => {
  const postFormCallback = usePostFormSubmitAction();
  const toastCallback = useUploadJarFormToast();
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
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
    resourceTypesNotValid: contextualSource ? [Resources.KnativeService] : [],
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
        postFormCallback(resp);
        toastCallback(resp);
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
