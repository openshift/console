import * as React from 'react';
import * as plugins from '@console/internal/plugins';
import { Formik } from 'formik';
import { history } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { connect } from 'react-redux';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import { GitImportFormData, FirehoseList } from './import-types';
import { createResources } from './import-submit-utils';
import { validationSchema } from './import-validation-utils';
import GitImportForm from './GitImportForm';
import SourceToImageForm from './SourceToImageForm';

export interface ImportFormProps {
  namespace: string;
  isS2I: boolean;
  imageStreams?: FirehoseList;
}

export interface StateProps {
  perspective: string;
}

const ImportForm: React.FC<ImportFormProps & StateProps> = ({
  namespace,
  imageStreams,
  isS2I,
  perspective,
}) => {
  const initialValues: GitImportFormData = {
    name: '',
    project: {
      name: namespace || '',
    },
    application: {
      name: '',
      selectedKey: '',
    },
    git: {
      url: '',
      type: '',
      ref: '',
      dir: '/',
      showGitType: false,
      secret: '',
    },
    image: {
      selected: '',
      recommended: '',
      tag: '',
      tagObj: {},
      ports: [],
    },
    route: {
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
    serverless: {
      trigger: false,
      scaling: {
        minpods: 0,
        maxpods: '',
        concurrencytarget: '',
        concurrencylimit: '',
      },
    },
    build: {
      env: [],
      triggers: {
        webhook: true,
        image: true,
        config: true,
      },
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
        request: null,
        requestUnit: 'm',
        limit: null,
        limitUnit: 'm',
      },
      memory: {
        request: null,
        requestUnit: 'Mi',
        limit: null,
        limitUnit: 'Mi',
      },
    },
  };
  const builderImages: NormalizedBuilderImages =
    imageStreams && imageStreams.loaded && normalizeBuilderImages(imageStreams.data);

  const handleRedirect = (project: string) => {
    const perspectiveData = plugins.registry
      .getPerspectives()
      .find((item) => item.properties.id === perspective);
    const redirectURL = perspectiveData.properties.getImportRedirectURL(project);
    history.push(redirectURL);
  };

  const handleSubmit = (values, actions) => {
    const imageStream = builderImages[values.image.selected].obj;

    const {
      project: { name: projectName },
    } = values;

    const dryRunRequests: Promise<K8sResourceKind[]> = createResources(values, imageStream, true);
    dryRunRequests
      .then(() => {
        const requests: Promise<K8sResourceKind[]> = createResources(values, imageStream);
        return requests;
      })
      .then(() => {
        actions.setSubmitting(false);
        handleRedirect(projectName);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  const renderForm = (props) => {
    if (isS2I) {
      return <SourceToImageForm {...props} builderImages={builderImages} />;
    }
    return <GitImportForm {...props} builderImages={builderImages} />;
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

const mapStateToProps = (state: RootState): StateProps => {
  return {
    perspective: getActivePerspective(state),
  };
};

export default connect(mapStateToProps)(ImportForm);
