import { sanitizeApplicationValue } from '@console/topology/src/utils';
import { healthChecksProbeInitialData } from '../health-checks/health-checks-probe-utils';
import { BaseFormData, Resources } from './import-types';

export const getBaseInitialValues = (
  namespace: string,
  activeApplication: string,
): BaseFormData => {
  return {
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
    image: {
      selected: '',
      recommended: '',
      tag: '',
      tagObj: {},
      ports: [],
      isRecommending: false,
      couldNotRecommend: false,
    },
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
      triggers: {},
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
};
