import * as React from 'react';
import * as _ from 'lodash';
import { Formik } from 'formik';
import { history } from '@console/internal/components/utils';
import { GitImportFormData, FirehoseList } from './import-types';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import {
  createDeploymentConfig,
  createImageStream,
  createBuildConfig,
  createService,
  createRoute,
} from './import-submit-utils';
import { validationSchema } from './import-validation-utils';
import GitImportForm from './GitImportForm';

export interface GitImportProps {
  namespace: string;
  imageStreams?: FirehoseList;
}

const GitImport: React.FC<GitImportProps> = ({ namespace, imageStreams }) => {
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
    },
    image: {
      selected: '',
      recommended: '',
      tag: '',
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
  };

  const builderImages: NormalizedBuilderImages =
    imageStreams && imageStreams.loaded && normalizeBuilderImages(imageStreams.data);

  const handleSubmit = (values, actions) => {
    const imageStream = builderImages[values.image.selected].obj;

    const {
      project: { name: projectName },
      route: { create: canCreateRoute },
      image: { ports },
    } = values;

    const requests = [
      createDeploymentConfig(values, imageStream),
      createImageStream(values, imageStream),
      createBuildConfig(values, imageStream),
    ];

    // Only create a service or route if the builder image has ports.
    if (!_.isEmpty(ports)) {
      requests.push(createService(values, imageStream));
      if (canCreateRoute) {
        requests.push(createRoute(values, imageStream));
      }
    }

    requests.forEach((r) => r.catch((err) => actions.setStatus({ submitError: err.message })));
    Promise.all(requests)
      .then(() => {
        actions.setSubmitting(false);
        history.push(`/topology/ns/${projectName}`);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={validationSchema}
      render={(props) => <GitImportForm {...props} builderImages={builderImages} />}
    />
  );
};

export default GitImport;
