import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';

type BindingApplicationResource = {
  name: string;
  resource: string;
};

type BindableService = {
  kind: string;
  name: string;
};

export const targetServiceExists = (services: BindableService[], targetService: K8sResourceKind) =>
  services.find(
    (service) =>
      service.kind === targetService.kind && service.name === targetService.metadata.name,
  );

export const sourceApplicationExists = (
  application: BindingApplicationResource,
  resource: K8sResourceKind,
  model: K8sKind,
) => application?.name === resource.metadata.name && application?.resource === model.plural;

export const checkExistingServiceBinding = (
  bindings: K8sResourceKind[],
  resource: K8sResourceKind,
  bindableService: K8sResourceKind,
  model: K8sKind,
) =>
  bindings.find(
    (binding) =>
      sourceApplicationExists(binding.spec.application, resource, model) &&
      Object.keys(targetServiceExists(binding.spec.services, bindableService) ?? {}).length !== 0,
  );
