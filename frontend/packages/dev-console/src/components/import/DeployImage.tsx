import * as React from 'react';
import { Formik } from 'formik';
import { history } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DeployImageFormData } from './import-types';
import { createResources } from './deployImage-submit-utils';
import { deployValidationSchema } from './deployImage-validation-utils';
import DeployImageForm from './DeployImageForm';

export interface DeployImageProps {
  namespace: string;
}

const DeployImage: React.FC<DeployImageProps> = ({ namespace }) => {
  const initialValues: DeployImageFormData = {
    project: {
      name: namespace || '',
    },
    application: {
      name: '',
      selectedKey: '',
    },
    name: '',
    searchTerm: '',
    isi: {
      name: '',
      image: {},
      tag: '',
      status: '',
      ports: [],
    },
    image: {
      name: '',
      image: {},
      tag: '',
      status: '',
      ports: [],
    },
    isSearchingForImage: false,
    serverless: {
      trigger: false,
      scaling: {
        minpods: 0,
        maxpods: '',
        concurrencytarget: '',
        concurrencylimit: '',
      },
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
    env: {},
  };

  const handleSubmit = (values, actions) => {
    const {
      project: { name: projectName },
    } = values;

    const dryRunRequests: Promise<K8sResourceKind[]> = createResources(values, true);
    dryRunRequests
      .then(() => {
        const requests: Promise<K8sResourceKind[]> = createResources(values);
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

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={deployValidationSchema}
      render={(props) => <DeployImageForm {...props} />}
    />
  );
};

export default DeployImage;
