import * as React from 'react';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { AccessReviewResourceAttributes } from './console-types';

/** This extension allows plugins to contribute an add action item to the add page of developer perspective.
    For example, a Serverless plugin can add a new action item for adding serverless functions
    to the add page of developer console. */
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
    href?: string;
    /** A callback that performs an action on click */
    callback?: CodeRef<(props: Record<string, any>) => void>;
    /** The perspective display icon. */
    icon?: CodeRef<React.ReactNode>;
    /** Optional access review to control visibility / enablement of the action. */
    accessReview?: AccessReviewResourceAttributes[];
  }
>;

/** This extension allows plugins to contibute a group in the add page of developer console.
    Groups can be referenced by actions, which will be grouped together in the add action page based on their extension definition.
    For example, a Serverless plugin can contribute a Serverless group and together with multiple add actions. */
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
    /** The perspective display icon. */
    icon?: CodeRef<React.ReactNode> | string;
  }
>;

// Type guards

export const isAddAction = (e: Extension): e is AddAction => {
  return e.type === 'dev-console.add/action';
};

export const isAddActionGroup = (e: Extension): e is AddActionGroup => {
  return e.type === 'dev-console.add/action-group';
};
