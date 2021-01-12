import * as React from 'react';
import { Formik, FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { history, AsyncComponent } from '@console/internal/components/utils';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { connect } from 'react-redux';
import {
  ALL_APPLICATIONS_KEY,
  useActivePerspective,
  usePostFormSubmitAction,
} from '@console/shared';
import { useExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import { UNASSIGNED_KEY, ALLOW_SERVICE_BINDING_FLAG } from '@console/topology/src/const';
import { sanitizeApplicationValue } from '@console/topology/src/utils/application-utils';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import { GitImportFormData, FirehoseList, ImportData, Resources } from './import-types';
import { createOrUpdateResources, handleRedirect } from './import-submit-utils';
import { validationSchema } from './import-validation-utils';
import { healthChecksProbeInitialData } from '../health-checks/health-checks-probe-utils';

export interface ImportFormProps {
  namespace: string;
  importData: ImportData;
  contextualSource?: string;
  imageStreams?: FirehoseList;
  projects?: {
    loaded: boolean;
    data: [];
  };
}

export interface StateProps {
  activeApplication: string;
  serviceBindingAvailable: boolean;
}

const ImportForm: React.FC<ImportFormProps & StateProps> = ({
  namespace,
  imageStreams,
  importData,
  contextualSource,
  activeApplication,
  projects,
}) => {
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);
  const postFormCallback = usePostFormSubmitAction();
  const initialValues: GitImportFormData = {
    name: '',
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
    application: {
      initial: sanitizeApplicationValue(activeApplication),
      name: sanitizeApplicationValue(activeApplication),
      selectedKey:
        activeApplication === t('devconsole~no application group')
          ? UNASSIGNED_KEY
          : activeApplication,
      isInContext: !!sanitizeApplicationValue(activeApplication),
    },
    git: {
      url: '',
      type: '',
      ref: '',
      dir: '/',
      showGitType: false,
      secret: '',
      isUrlValidating: false,
    },
    docker: {
      dockerfilePath: 'Dockerfile',
    },
    image: {
      selected: '',
      recommended: '',
      tag: '',
      tagObj: {},
      ports: [],
      isRecommending: false,
      couldNotRecommend: false,
    },
    route: {
      disable: false,
      create: true,
      targetPort: '',
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
    resourceTypesNotValid: contextualSource ? [Resources.KnativeService] : [],
    serverless: {
      scaling: {
        minpods: 0,
        maxpods: '',
        concurrencytarget: '',
        concurrencylimit: '',
      },
    },
    pipeline: {
      enabled: false,
    },
    build: {
      env: [],
      triggers: {
        webhook: true,
        image: true,
        config: true,
      },
      strategy: importData.buildStrategy || 'Source',
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
  const builderImages: NormalizedBuilderImages =
    imageStreams && imageStreams.loaded && normalizeBuilderImages(imageStreams.data);

  const handleSubmit = (values, actions) => {
    const imageStream = builderImages && builderImages[values.image.selected].obj;
    const createNewProject = projects.loaded && _.isEmpty(projects.data);
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

    return resourceActions
      .then(() => {
        handleRedirect(projectName, perspective, perspectiveExtensions);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  const renderForm = (formikProps: FormikProps<any>) => {
    return (
      <AsyncComponent
        {...formikProps}
        projects={projects}
        builderImages={builderImages}
        loader={importData.loader}
      />
    );
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={validationSchema(t)}
    >
      {renderForm}
    </Formik>
  );
};

type OwnProps = ImportFormProps & { forApplication?: string };
const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const activeApplication = ownProps.forApplication || getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
    serviceBindingAvailable: state.FLAGS.get(ALLOW_SERVICE_BINDING_FLAG),
  };
};

export default connect(mapStateToProps)(ImportForm);
