import { AccessReviewResourceAttributes, SetFeatureFlag } from '@console/dynamic-plugin-sdk';
import { checkAccess } from '@console/internal/components/utils/rbac';
import { SelfSubjectAccessReviewKind } from '@console/internal/module/k8s';
import { NetworkAttachmentDefinitionModel } from '../models';
import { FLAG_CAN_VIEW_NADS } from './const';

export const checkNadPermissions = async (setFeatureFlag: SetFeatureFlag) => {
  let id = null;

  const setFlag = () => {
    const nadSsarAttributes: AccessReviewResourceAttributes = {
      group: NetworkAttachmentDefinitionModel.apiGroup,
      resource: NetworkAttachmentDefinitionModel.plural,
      verb: 'list',
    };

    checkAccess(nadSsarAttributes)
      .then((result: SelfSubjectAccessReviewKind) => {
        setFeatureFlag(FLAG_CAN_VIEW_NADS, result.status.allowed);
      })
      .catch((e) => {
        console.warn('SelfSubjectAccessReview failed', e); // eslint-disable-line no-console
        // Default to enabling the action if the access review fails so that we
        // don't incorrectly block users from actions they can perform. The server
        // still enforces access control.
        // setFeatureFlag(FLAG_CAN_VIEW_NADS, true);
        clearInterval(id);
      });
  };

  setFlag();
  id = setInterval(setFlag, 10 * 1000);
};
