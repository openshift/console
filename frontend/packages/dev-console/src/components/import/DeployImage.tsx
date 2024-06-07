import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { ImportStrategy } from '@console/git-service/src/types';
import { history } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ALL_APPLICATIONS_KEY, usePostFormSubmitAction } from '@console/shared';
import { sanitizeApplicationValue } from '@console/topology/src/utils/application-utils';
import { healthChecksProbeInitialData } from '../health-checks/health-checks-probe-utils';
import { createOrUpdateDeployImageResources } from './deployImage-submit-utils';
import { deployValidationSchema } from './deployImage-validation-utils';
import DeployImageForm from './DeployImageForm';
import { filterDeployedResources } from './import-submit-utils';
import { DeployImageFormData, FirehoseList, Resources } from './import-types';
import { useUpdateKnScalingDefaultValues } from './serverless/useUpdateKnScalingDefaultValues';

export interface DeployImageProps {
  namespace: string;
  projects?: FirehoseList;
  contextualSource?: string;
}

interface StateProps {
  activeApplication: string;
}

type Props = DeployImageProps & StateProps;

const DeployImage: React.FC<Props> = ({
  namespace,
  projects,
  activeApplication,
  contextualSource,
}) => {
  const postFormCallback = usePostFormSubmitAction();
  const { t } = useTranslation();
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
      isInContext: !!sanitizeApplicationValue(activeApplication),
    },
    name: '',
    searchTerm: '',
    registry: 'external',
    allowInsecureRegistry: false,
    imageStream: {
      image: '',
      tag: '',
      namespace: namespace || '',
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
    import: {
      selectedStrategy: {
        name: '',
        type: ImportStrategy.S2I,
        priority: 0,
        detectedFiles: [],
      },
    },
    runtimeIcon: null,
    isSearchingForImage: false,
    serverless: {
      scaling: {
        minpods: '',
        maxpods: '',
        concurrencytarget: '',
        concurrencylimit: '',
        autoscale: {
          autoscalewindow: '',
          autoscalewindowUnit: '',
          defaultAutoscalewindowUnit: 's',
        },
        concurrencyutilization: '',
      },
      domainMapping: [],
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
        termination: null,
        insecureEdgeTerminationPolicy: null,
        caCertificate: '',
        certificate: '',
        destinationCACertificate: '',
        key: '',
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

  const initialVals = useUpdateKnScalingDefaultValues(initialValues);

  const handleSubmit = (
    values: DeployImageFormData,
    helpers: FormikHelpers<DeployImageFormData>,
  ) => {
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
    resourceActions
      .then((resources) => postFormCallback(resources))
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.log('Failed to create or update image resources', err);
      });

    return resourceActions
      .then((res) => {
        const selectId = filterDeployedResources(res)[0]?.metadata?.uid;

        history.push(`/topology/ns/${projectName}${selectId ? `?selectId=${selectId}` : ''}`);
      })
      .catch((err) => {
        helpers.setStatus({ submitError: err.message });
      });
  };

  return (
    <Formik
      initialValues={initialVals}
      onSubmit={handleSubmit}
      onReset={history.goBack}
      validationSchema={deployValidationSchema(t)}
    >
      {(formikProps) => <DeployImageForm {...formikProps} projects={projects} />}
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
  };
};

export default connect(mapStateToProps)(DeployImage);
