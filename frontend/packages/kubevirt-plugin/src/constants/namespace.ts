// Use a key for the "all" namespaces option that would be an invalid namespace name to avoid a potential clash
export const ALL_NAMESPACES_KEY = '#ALL_NS#';
export const NAMESPACE_OPENSHIFT = 'openshift';
export const KUBEVIRT_OS_IMAGES_NS = 'kubevirt-os-images';
export const OPENSHIFT_OS_IMAGES_NS = 'openshift-virtualization-os-images';

export const ANNOTATIONS = Object.freeze({
  displayName: 'openshift.io/display-name',
  providerDisplayName: 'openshift.io/provider-display-name',
  documentationURL: 'openshift.io/documentation-url',
  supportURL: 'openshift.io/support-url',
});
