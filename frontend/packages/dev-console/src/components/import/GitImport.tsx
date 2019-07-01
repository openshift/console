import * as React from 'react';
import { Formik } from 'formik';
import { history } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { GitImportFormData, FirehoseList } from './import-types';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import { createResources } from './import-submit-utils';
import { validationSchema } from './import-validation-utils';
import GitImportForm from './GitImportForm';
import SourceToImageForm from './SourceToImageForm';

export interface GitImportProps {
  namespace: string;
  isS2I: boolean;
  imageStreams?: FirehoseList;
}

const GitImport: React.FC<GitImportProps> = ({ namespace, imageStreams, isS2I }) => {
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
    } = values;

    const dryRunRequests: Promise<K8sResourceKind[]> = createResources(values, imageStream, true);
    dryRunRequests
      .then(() => {
        const requests: Promise<K8sResourceKind[]> = createResources(values, imageStream);
        return requests;
      })
      .then(() => {
        actions.setSubmitting(false);
        history.push(`/topology/ns/${projectName}`);
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

export default GitImport;
