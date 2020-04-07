import { K8sVerb, K8sKind, AccessReviewResourceAttributes } from '@console/internal/module/k8s';
import { DeploymentModel, TemplateModel } from '@console/internal/models';
import * as models from '../models';

const accessReviewModelMapper = (verb: K8sVerb) => (
  model: K8sKind,
): AccessReviewResourceAttributes => ({
  group: model.apiGroup || '',
  resource: model.plural,
  verb,
});

export const accessReviewImportVM = [
  ...[models.VirtualMachineModel, models.DataVolumeModel, DeploymentModel].map(
    accessReviewModelMapper('create'),
  ),
  ...[TemplateModel].map(accessReviewModelMapper('get')),
];
