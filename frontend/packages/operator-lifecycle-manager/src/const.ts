export enum Flags {
  OPERATOR_LIFECYCLE_MANAGER = 'OPERATOR_LIFECYCLE_MANAGER',
}

export const GLOBAL_OPERATOR_NAMESPACE = 'openshift-operators';
export const OPERATOR_UNINSTALL_MESSAGE_ANNOTATION = 'operator.openshift.io/uninstall-message';
export const operatorTypeAnnotation = 'operators.operatorframework.io/operator-type';
export const nonStandaloneAnnotationValue = 'non-standalone';
