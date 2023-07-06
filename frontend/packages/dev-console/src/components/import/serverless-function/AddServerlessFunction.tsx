import * as React from 'react';
import { ValidatedOptions } from '@patternfly/react-core';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  useActivePerspective,
  WatchK8sResults,
  WatchK8sResultsObject,
} from '@console/dynamic-plugin-sdk';
import { GitProvider } from '@console/git-service/src';
import { LoadingBox, history } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ImageStreamModel, ProjectModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { defaultRepositoryFormValues } from '@console/pipelines-plugin/src/components/repository/consts';
import {
  ALL_APPLICATIONS_KEY,
  usePerspectives,
  usePostFormSubmitAction,
  useTelemetry,
} from '@console/shared/src';
import { sanitizeApplicationValue } from '@console/topology/src/utils/application-utils';
import { normalizeBuilderImages, NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import { getBaseInitialValues } from '../form-initial-values';
import { createOrUpdateResources, handleRedirect } from '../import-submit-utils';
import { BaseFormData, Resources } from '../import-types';
import { validationSchema } from '../import-validation-utils';
import { useUpdateKnScalingDefaultValues } from '../serverless/useUpdateKnScalingDefaultValues';
import AddServerlessFunctionForm from './AddServerlessFunctionForm';

// eslint-disable-next-line @typescript-eslint/naming-convention
type WatchResource = {
  [key: string]: K8sResourceKind[] | K8sResourceKind;
};

type AddServerlessFunctionProps = {
  namespace: string;
  forApplication: string;
};

const AddServerlessFunction: React.FC<AddServerlessFunctionProps> = ({
  namespace,
  forApplication,
}) => {
  const { t } = useTranslation();
  const postFormCallback = usePostFormSubmitAction();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = usePerspectives();
  const fireTelemetryEvent = useTelemetry();
  const application = forApplication || '';
  const activeApplication = application !== ALL_APPLICATIONS_KEY ? application : '';
  const initialBaseValues: BaseFormData = getBaseInitialValues(namespace, activeApplication);
  const initialValues = {
    ...initialBaseValues,
    formType: 'serverlessFunction',
    resources: Resources.KnativeService,
    application: {
      ...initialBaseValues.application,
      isInContext: !!sanitizeApplicationValue(activeApplication),
    },
    git: {
      url: '',
      type: GitProvider.INVALID,
      ref: '',
      dir: '/',
      showGitType: false,
      secret: '',
      isUrlValidating: false,
      validated: ValidatedOptions.default,
    },
    import: {
      showEditImportStrategy: true,
    },
    docker: {
      dockerfilePath: '',
      dockerfileHasError: true,
    },
    devfile: {
      devfilePath: '',
      devfileHasError: false,
    },
    build: {
      ...initialBaseValues.build,
      env: [],
      triggers: {
        webhook: true,
        image: true,
        config: true,
      },
      strategy: 'Source',
    },
    pipeline: {
      enabled: false,
    },
    pac: {
      pacHasError: false,
      repository: {
        ...defaultRepositoryFormValues,
      },
    },
  };

  const initialVals = useUpdateKnScalingDefaultValues(initialValues);

  const watchedResources = {
    imageStreams: {
      kind: ImageStreamModel.kind,
      isList: true,
      namespace: 'openshift',
    },
    projects: {
      kind: ProjectModel.kind,
      isList: true,
    },
  };
  const resourcesData: WatchK8sResults<WatchResource> = useK8sWatchResources<WatchResource>(
    watchedResources,
  );

  const isResourceLoaded =
    Object.keys(resourcesData).length > 0 &&
    Object.values(resourcesData).every((value) => value.loaded || !!value.loadError);

  if (!isResourceLoaded) return <LoadingBox />;

  const { loaded: isLoaded, data: isData, loadError: isLoadError } = resourcesData.imageStreams;

  const builderImages: NormalizedBuilderImages =
    !isLoadError && isLoaded && isData && normalizeBuilderImages(isData);

  const handleSubmit = (values, actions) => {
    const imageStream = builderImages && builderImages[values.image.selected]?.obj;
    const createNewProject =
      resourcesData.projects.loaded && _.isEmpty(resourcesData.projects.data);
    const {
      project: { name: projectName },
    } = values;

    const resourceActions = createOrUpdateResources(
      t,
      values,
      imageStream,
      createNewProject,
      true,
    ).then(() => createOrUpdateResources(t, values, imageStream));

    resourceActions
      .then((resources) => {
        postFormCallback(resources);
      })
      .catch(() => {});
    fireTelemetryEvent('Serverless Function being created');
    return resourceActions
      .then(() => {
        handleRedirect(projectName, perspective, perspectiveExtensions);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Error while submitting import form:', err);
        actions.setStatus({ submitError: err.message });
      });
  };
  return (
    <Formik
      initialValues={initialVals}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={validationSchema(t)}
    >
      {(formikProps) => (
        <AddServerlessFunctionForm
          {...formikProps}
          projects={resourcesData.projects as WatchK8sResultsObject<K8sResourceKind[]>}
          builderImages={builderImages}
        />
      )}
    </Formik>
  );
};

export default AddServerlessFunction;
