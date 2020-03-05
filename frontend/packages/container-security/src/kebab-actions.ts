import { K8sKind, PodKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s/k8s';
import { KebabOption } from '@console/internal/components/utils/kebab';
import { PodModel } from '@console/internal/models';
import { GetKebabActions } from '@console/plugin-sdk';
import { ImageManifestVulnModel } from './models';

const listPathFor = (namespace: string, imageID: string) =>
  [
    '/k8s',
    namespace === '' ? 'all-namespaces' : `ns/${namespace}`,
    referenceForModel(ImageManifestVulnModel),
    `?name=sha256.${imageID.split('sha256:')[1]}`,
  ].join('/');

const ViewImageVulnerabilities = (model: K8sKind, obj: PodKind): KebabOption => {
  const ready = (obj.status?.containerStatuses || []).length > 0;

  return {
    label: 'View Image Vulnerabilities',
    hidden: !ready,
    href: ready ? listPathFor(obj.metadata.namespace, obj.status.containerStatuses[0].imageID) : '',
    accessReview: {
      group: ImageManifestVulnModel.apiGroup,
      resource: ImageManifestVulnModel.plural,
      namespace: obj.metadata.namespace,
      verb: 'list',
    },
  };
};

export const getKebabActions: GetKebabActions = (model) => {
  return model && (referenceForModel(model) === referenceForModel(PodModel) || model.kind === 'Pod')
    ? [ViewImageVulnerabilities]
    : [];
};
