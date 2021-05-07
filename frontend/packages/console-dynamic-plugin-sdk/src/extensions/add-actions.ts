import * as React from 'react';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { AccessReviewResourceAttributes } from './console-types';

export type AddAction = ExtensionDeclaration<
  'dev-console.add/action',
  {
    /** ID used to identify the action. */
    id: string;
    /** IDs used to identify the action groups the action would belong to. */
    groupId?: string;
    /** The label of the action */
    label: string;
    /** The description of the action. */
    description: string;
    /** The href to navigate to. */
    href: string;
    /** The perspective display icon. */
    icon?: CodeRef<React.ReactNode>;
    /** Optional access review to control visibility / enablement of the action. */
    accessReview?: AccessReviewResourceAttributes[];
  }
>;

export type AddActionGroup = ExtensionDeclaration<
  'dev-console.add/action-group',
  {
    /** ID used to identify the action group. */
    id: string;
    /** The title of the action group */
    name: string;
    /** ID of action group before which this group should be placed */
    insertBefore?: string;
    /** ID of action group after which this group should be placed */
    insertAfter?: string;
  }
>;

// Type guards

export const isAddAction = (e: Extension): e is AddAction => {
  return e.type === 'dev-console.add/action';
};

export const isAddActionGroup = (e: Extension): e is AddActionGroup => {
  return e.type === 'dev-console.add/action-group';
};
