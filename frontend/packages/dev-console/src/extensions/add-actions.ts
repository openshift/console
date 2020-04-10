import { Extension } from '@console/plugin-sdk/src/typings/base';
import { AccessReviewResourceAttributes } from '@console/internal/module/k8s';

namespace ExtensionProperties {
  export type AddAction = {
    /** ID used to identify the action. */
    id: string;
    /** The label of the action */
    label: string;
    /** The description of the action. */
    description: string;
    /** The perspective display icon. */
    icon?: string;
    /** The perspective display icon css class. */
    iconClass?: string;
    /** The URL to navigate to. */
    url: string;
    /** Optional access review to control visibility / enablement of the action. */
    accessReview?: AccessReviewResourceAttributes[];
  };
}

export interface AddAction extends Extension<ExtensionProperties.AddAction> {
  type: 'AddAction';
}

export const isAddAction = (e: Extension): e is AddAction => {
  return e.type === 'AddAction';
};
