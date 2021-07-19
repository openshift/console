export enum Flags {
  OPERATOR_LIFECYCLE_MANAGER = 'OPERATOR_LIFECYCLE_MANAGER',
}

export const GLOBAL_OPERATOR_NAMESPACE = 'openshift-operators';
export const OPERATOR_UNINSTALL_MESSAGE_ANNOTATION = 'operator.openshift.io/uninstall-message';
export const OPERATOR_TYPE_ANNOTATION = 'operators.operatorframework.io/operator-type';
export const NON_STANDALONE_ANNOTATION_VALUE = 'non-standalone';
export const INTERNAL_OBJECTS_ANNOTATION = 'operators.operatorframework.io/internal-objects';
