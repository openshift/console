import * as React from 'react';
import { JSONSchema7Type } from 'json-schema';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { AccessReviewResourceAttributes } from './console-types';

export type Resource = {
  /** Resource API group and version */
  api: string;
  /** Resource kind */
  kind: string;
  /** Resource name, or namespace and name for namespaced-scoped resources */
  resource: {
    metadata: {
      namespace?: string;
      name: string;
    };
  };
};

export type Path = string;

export type ClusterConfigurationFieldProps = {
  readonly: boolean;
};

export enum ClusterConfigurationFieldType {
  text = 'text',
  checkbox = 'checkbox',
  dropdown = 'dropdown',
  custom = 'custom',
}

export type ClusterConfigurationTextField = {
  type: ClusterConfigurationFieldType.text;
  defaultValue?: string;
  /**
   * Update operation that is used to save the latest text value.
   * If `update.patch.value` is not defined the text value will be used.
   * If `update.patch.value` is defined is must be a string, object or array.
   * The text value will be automatically inserted into the placeholder `$value`.
   */
  resource: Resource;
  path: Path;
};

export type ClusterConfigurationCheckboxFieldValue = string | number | boolean;

export type ClusterConfigurationCheckboxField = {
  type: ClusterConfigurationFieldType.checkbox;
  defaultValue?: ClusterConfigurationCheckboxFieldValue;
  trueValue?: ClusterConfigurationCheckboxFieldValue;
  falseValue?: ClusterConfigurationCheckboxFieldValue;
  /**
   * A patch operation that is used to save if the checkbox is checked.
   * if `update.patch.value` is not defined a true (boolean) is automatically set.
   * If `update.patch.value` is defined is must be a string, object or array.
   * The text value will be automatically inserted into the placeholder `$value`.
   */
  resource: Resource;
  path: Path;
};

export type ClusterConfigurationDropdownFieldValue = string;

export type ClusterConfigurationDropdownField = {
  type: ClusterConfigurationFieldType.dropdown;
  defaultValue?: ClusterConfigurationDropdownFieldValue;
  options: {
    value: ClusterConfigurationDropdownFieldValue;
    label: string;
    description?: string;
  }[];
  /**
   * A patch operation that is used to save if the checkbox is checked.
   * if `update.patch.value` is not defined a true (boolean) is automatically set.
   * If `update.patch.value` is defined is must be a string, object or array.
   * The text value will be automatically inserted into the placeholder `$value`.
   */
  resource: Resource;
  path: Path;
};

export type ClusterConfigurationCustomField = {
  type: ClusterConfigurationFieldType.custom;
  component: CodeRef<React.ComponentType<ClusterConfigurationFieldProps>>;
  props?: { [key: string]: JSONSchema7Type };
};

export type ClusterConfigurationField = ClusterConfigurationCustomField;

export type ClusterConfigurationGroup = ExtensionDeclaration<
  'console.cluster-configuration/group',
  {
    /** ID used to identify the cluster configuration group. */
    id: string;
    /** The label of the cluster configuration group. */
    label: string;
    /** ID of cluster configuration group before which this group should be placed. */
    insertBefore?: string;
    /** ID of cluster configuration group after which this group should be placed. */
    insertAfter?: string;
  }
>;

export type ClusterConfigurationItem = ExtensionDeclaration<
  'console.cluster-configuration/item',
  {
    /** ID used to identify the cluster configuration item and referenced in insertAfter and insertBefore to define the item order. */
    id: string;
    /** IDs used to identify the cluster configuration groups the item would belong to. */
    groupId: string;
    /** The label of the cluster configuration */
    label: string;
    /** The description of the cluster configuration. */
    description: string;
    /** The UI field configuration to render input field or custom components that allow the user to change the cluster configuration. */
    field: ClusterConfigurationField;
    /** ID of cluster configuration item before which this item should be placed. */
    insertBefore?: string;
    /** ID of cluster configuration item after which this item should be placed. */
    insertAfter?: string;
    /**
     * Optional list of resources that are neccessary to render the input field with the current configuration state.
     * If the user has not access to all required fields the input field is not rendered at all.
     */
    readAccessReview?: AccessReviewResourceAttributes[];
    /**
     * Optional list of resources that are neccessary to update the configuration.
     * If The user has access to all readAccessReview resources, but not all writeAccessReview the input field is rendered read-only.
     */
    writeAccessReview?: AccessReviewResourceAttributes[];
  }
>;

// Type guards

export const isClusterConfigurationGroup = (e: Extension): e is ClusterConfigurationGroup => {
  return e.type === 'console.cluster-configuration/group';
};

export const isClusterConfigurationItem = (e: Extension): e is ClusterConfigurationItem => {
  return e.type === 'console.cluster-configuration/item';
};
