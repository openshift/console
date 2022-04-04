import * as _ from 'lodash-es';
import * as yup from 'yup';
import { K8sResourceKind, RouteKind, RouteTarget } from '@console/internal/module/k8s';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { getActiveNamespace } from '../../actions/ui';
import { AlternateServiceEntryType, RouteFormProps, UNNAMED_PORT_KEY } from './create-route';

export const routeValidationSchema = yup.object({
  editorType: yup.string(),
  formData: yup.object().when('editorType', {
    is: EditorType.Form,
    then: yup.object({
      name: yup.string().required(),
      service: yup.string().required(),
      targetPort: yup.string().required(),
      termination: yup.string().when('formData.secure', {
        is: true,
        then: yup.string().required(),
      }),
    }),
  }),
});

export const convertRouteToEditForm = (
  services: K8sResourceKind[],
  data: RouteKind,
): Partial<RouteFormProps> => {
  if (!data) {
    return null;
  }
  const { metadata, spec } = data;
  return {
    name: metadata?.name,
    hostname: spec?.host,
    path: spec?.path,
    service: services?.find((s) => s.metadata.name === spec?.to?.name),
    weight: spec?.to?.weight,
    targetPort: spec?.port?.targetPort as string,
    termination: spec?.tls?.termination,
    insecureEdgeTerminationPolicy: spec?.tls?.insecureEdgeTerminationPolicy,
    certificate: spec?.tls?.certificate,
    key: spec?.tls?.key,
    caCertificate: spec?.tls?.caCertificate,
    destinationCACertificate: spec?.tls?.destinationCACertificate,
    secure: !!spec?.tls,
    namespace: metadata?.namespace || getActiveNamespace(),
    labels: metadata?.labels,
    alternateServices: Array.isArray(spec?.alternateBackends)
      ? spec.alternateBackends.map((b) => ({
          name: b.name,
          weight: b.weight,
          key: _.uniqueId('alternate-backend-'),
        }))
      : [],
  };
};

const createRoteTls = (formData: RouteFormProps) => {
  const {
    termination,
    insecureEdgeTerminationPolicy,
    certificate,
    key,
    caCertificate,
    destinationCACertificate,
    secure,
  } = formData;

  return secure
    ? {
        termination,
        insecureEdgeTerminationPolicy,
        certificate,
        key,
        caCertificate,
        destinationCACertificate,
      }
    : null;
};

export const createAlternateBackends = (
  alternateServices: RouteFormProps['alternateServices'],
): RouteTarget[] => {
  return _.filter(alternateServices, 'name').map((serviceData: AlternateServiceEntryType) => {
    return {
      weight: serviceData.weight,
      kind: 'Service',
      name: serviceData.name,
    };
  });
};

export const convertEditFormToRoute = (
  formData: RouteFormProps,
  existingRoute?: RouteKind,
): RouteKind => {
  const {
    name,
    hostname,
    path,
    service,
    weight,
    targetPort: selectedPort,
    namespace,
    alternateServices,
  } = formData;

  const tls = createRoteTls(formData);

  const serviceName = _.get(service, 'metadata.name');
  const labels = _.merge(
    _.get(service, 'metadata.labels'),
    _.get(existingRoute, 'metadata.labels'),
  );

  // If the port is unnamed, there is only one port. Use the port number.
  const targetPort =
    selectedPort === UNNAMED_PORT_KEY
      ? _.get(service, 'spec.ports[0].targetPort') || _.get(service, 'spec.ports[0].port')
      : selectedPort;

  const alternateBackends = createAlternateBackends(alternateServices);

  const route: RouteKind = {
    ...(existingRoute || {}),
    kind: 'Route',
    apiVersion: 'route.openshift.io/v1',
    metadata: {
      ..._.get(existingRoute, 'metadata', {}),
      name,
      namespace: namespace || getActiveNamespace(),
      labels,
    },
    spec: {
      ..._.get(existingRoute, 'spec', {}),
      to: {
        kind: 'Service',
        name: serviceName,
        weight,
      },
      tls,
      host: hostname,
      path,
      port: {
        targetPort,
      },
    },
  };

  if (!_.isEmpty(alternateBackends)) {
    route.spec.alternateBackends = alternateBackends;
  }

  return route;
};
