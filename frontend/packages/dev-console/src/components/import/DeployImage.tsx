import * as React from 'react';
import { Formik } from 'formik';
import { history } from '@console/internal/components/utils';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { connect } from 'react-redux';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DeployImageFormData, FirehoseList, Resources } from './import-types';
import { createOrUpdateDeployImageResources } from './deployImage-submit-utils';
import { deployValidationSchema } from './deployImage-validation-utils';
import DeployImageForm from './DeployImageForm';

export interface DeployImageProps {
  namespace: string;
  projects?: FirehoseList;
}

interface StateProps {
  activeApplication: string;
}

type Props = DeployImageProps & StateProps;

const DeployImage: React.FC<Props> = ({ namespace, projects, activeApplication }) => {
  const initialValues: DeployImageFormData = {
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
    name: '',
    searchTerm: '',
    registry: 'external',
    imageStream: {
      image: '',
      tag: '',
      namespace: '',
      grantAccess: true,
    },
    isi: {
      name: '',
      image: {},
      tag: '',
      status: { metadata: {}, status: '' },
      ports: [],
    },
    image: {
      name: '',
      image: {},
      tag: '',
      status: { metadata: {}, status: '' },
      ports: [],
    },
    isSearchingForImage: false,
    serverless: {
      scaling: {
        minpods: 0,
        maxpods: '',
        concurrencytarget: '',
        concurrencylimit: '',
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
      triggers: {
        webhook: true,
        image: true,
        config: true,
      },
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
    env: {},
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

  const handleSubmit = (values, actions) => {
    const {
      project: { name: projectName },
    } = values;

    const dryRunRequests: Promise<K8sResourceKind[]> = createOrUpdateDeployImageResources(
      values,
      true,
    );
    dryRunRequests
      .then(() => {
        const requests: Promise<K8sResourceKind[]> = createOrUpdateDeployImageResources(values);
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
      render={(props) => <DeployImageForm {...props} projects={projects} />}
    />
  );
};

const mapStateToProps = (state: RootState): StateProps => {
  const activeApplication = getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
  };
};

export default connect(mapStateToProps)(DeployImage);
