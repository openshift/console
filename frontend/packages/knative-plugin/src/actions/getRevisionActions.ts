import { Kebab } from '@console/internal/components/utils';
import { RevisionModel } from '../models';
import { deleteRevision } from './delete-revision';

export const getRevisionActions = () => {
  let deleteFound = false;
  const commonActions = Kebab.factory.common.map((action) => {
    if (action.name === 'Delete') {
      deleteFound = true;
      return deleteRevision;
    }
    return action;
  });
  if (!deleteFound) {
    commonActions.push(deleteRevision);
  }
  return [...Kebab.getExtensionsActionsForKind(RevisionModel), ...commonActions];
};
