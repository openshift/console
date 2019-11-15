import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceKind } from '@console/knative-plugin/src/types';
import { VMIKind } from '../../types';
import { getVmiTemplateLabels } from '../vmi/basic';

export const getServicePort = (service: K8sResourceKind, targetPort: number) =>
  _.get(service, ['spec', 'ports'], []).find(
    (servicePort) => targetPort === servicePort.targetPort,
  );

const getServiceSelectors = (service: ServiceKind) =>
  service && service.spec && service.spec.selector ? service.spec.selector : {};

export const getServicesForVmi = (services: ServiceKind[], vmi: VMIKind): ServiceKind[] => {
  const vmLabels = getVmiTemplateLabels(vmi);
  return services.filter((service) => {
    const selectors = getServiceSelectors(service);
    const selectorKeys = Object.keys(selectors);
    return selectorKeys.length > 0
      ? selectorKeys.every((key) => vmLabels[key] === selectors[key])
      : false;
  });
};
