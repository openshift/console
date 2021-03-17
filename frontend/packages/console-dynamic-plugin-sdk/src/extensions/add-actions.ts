import * as React from 'react';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';
import { ExtensionAccessReviewResourceAttributes } from '../utils/common';

namespace ExtensionProperties {
  export type AddAction = {
    /** ID used to identify the action. */
    id: string;
    /** The label of the action */
    label: string;
    /** The description of the action. */
    description: string;
    /** The href to navigate to. */
    href: string;
    /** The perspective display icon. */
    icon?: string | EncodedCodeRef;
    /** Optional access review to control visibility / enablement of the action. */
    accessReview?: ExtensionAccessReviewResourceAttributes[];
  };

  export type AddActionCodeRefs = {
    icon?: CodeRef<React.ReactNode>;
  };
}

export type AddAction = Extension<ExtensionProperties.AddAction> & {
  type: 'dev-console.add/action';
};

export type ResolvedAddAction = UpdateExtensionProperties<
  AddAction,
  ExtensionProperties.AddActionCodeRefs
>;

export const isAddAction = (e: Extension): e is ResolvedAddAction => {
  return e.type === 'dev-console.add/action';
};
