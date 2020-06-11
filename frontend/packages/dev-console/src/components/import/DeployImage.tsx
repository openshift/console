import * as React from 'react';
import { Formik } from 'formik';
import { connect } from 'react-redux';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { history } from '@console/internal/components/utils';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { doContextualBinding, sanitizeApplicationValue } from '../../utils/application-utils';
import { ALLOW_SERVICE_BINDING } from '../../const';
import { DeployImageFormData, FirehoseList, Resources } from './import-types';
import { createOrUpdateDeployImageResources } from './deployImage-submit-utils';
import { deployValidationSchema } from './deployImage-validation-utils';
import DeployImageForm from './DeployImageForm';
import { healthChecksProbeInitialData } from '../health-checks/health-checks-probe-utils';

export interface DeployImageProps {
  namespace: string;
  projects?: FirehoseList;
  contextualSource?: string;
}

interface StateProps {
  activeApplication: string;
  serviceBindingAvailable: boolean;
}

type Props = DeployImageProps & StateProps;

const DeployImage: React.FC<Props> = ({
  namespace,
  projects,
  activeApplication,
  contextualSource,
  serviceBindingAvailable,
}) => {
  const initialValues: DeployImageFormData = {
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
    application: {
      initial: sanitizeApplicationValue(activeApplication),
      name: sanitizeApplicationValue(activeApplication),
      selectedKey: activeApplication,
    },
    name: '',
    searchTerm: '',
    registry: 'external',
    allowInsecureRegistry: false,
    imageStream: {
      image: '',
      tag: '',
      namespace: namespace || '',
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
    resourceTypesNotValid: contextualSource ? [Resources.KnativeService] : [],
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
    healthChecks: healthChecksProbeInitialData,
  };

  const handleSubmit = (values, actions) => {
    const {
      project: { name: projectName },
    } = values;

    const resourceActions: Promise<K8sResourceKind[]> = createOrUpdateDeployImageResources(
      values,
      true,
    ).then(() => {
      const requests: Promise<K8sResourceKind[]> = createOrUpdateDeployImageResources(values);
      return requests;
    });

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
    >
      {(props) => <DeployImageForm {...props} projects={projects} />}
    </Formik>
  );
};

interface OwnProps extends DeployImageProps {
  forApplication?: string;
}
const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const activeApplication = ownProps.forApplication || getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
    serviceBindingAvailable: state.FLAGS.get(ALLOW_SERVICE_BINDING),
  };
};

export default connect(mapStateToProps)(DeployImage);
