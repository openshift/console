import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { ValidatedOptions } from '@patternfly/react-core';
import { history, AsyncComponent } from '@console/internal/components/utils';
import { getActivePerspective, getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { connect } from 'react-redux';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import { doContextualBinding } from '../../utils/application-utils';
import { ALLOW_SERVICE_BINDING } from '../../const';
import { GitImportFormData, FirehoseList, ImportData, Resources } from './import-types';
import { createOrUpdateResources, handleRedirect } from './import-submit-utils';
import { validationSchema } from './import-validation-utils';

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
  perspective: string;
  activeApplication: string;
  serviceBindingAvailable: boolean;
}

const ImportForm: React.FC<ImportFormProps & StateProps> = ({
  namespace,
  imageStreams,
  importData,
  contextualSource,
  perspective,
  activeApplication,
  projects,
  serviceBindingAvailable,
}) => {
  const initialValues: GitImportFormData = {
    name: '',
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
    application: {
      initial: activeApplication,
      name: activeApplication,
      selectedKey: activeApplication,
    },
    git: {
      url: '',
      type: '',
      ref: '',
      dir: '/',
      showGitType: false,
      secret: '',
      urlValidation: ValidatedOptions.default,
      isUrlValidating: false,
    },
    docker: {
      dockerfilePath: 'Dockerfile',
      containerPort: 8080,
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
      values,
      imageStream,
      createNewProject,
      true,
    ).then(() => createOrUpdateResources(values, imageStream));

    if (contextualSource) {
      resourceActions
        .then((resources) =>
          doContextualBinding(resources, contextualSource, serviceBindingAvailable),
        )
        .catch(() => {});
    }

    resourceActions
      .then(() => {
        actions.setSubmitting(false);
        handleRedirect(projectName, perspective);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  const renderForm = (props) => {
    return (
      <AsyncComponent
        {...props}
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
      validationSchema={validationSchema}
      render={renderForm}
    />
  );
};

type OwnProps = ImportFormProps & { forApplication?: string };
const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const perspective = getActivePerspective(state);
  const activeApplication = ownProps.forApplication || getActiveApplication(state);
  return {
    perspective,
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
    serviceBindingAvailable: state.FLAGS.get(ALLOW_SERVICE_BINDING),
  };
};

export default connect(mapStateToProps)(ImportForm);
