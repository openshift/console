/* IMPORTANT: this file is patched for downstream builds.
 * Please keep all changes here compact and synced will downstream patches.
*/

/**
 Initialization of kubevirt.

 Kubevirt is enabled by lazy setting of FLAGS.KUBEVIRT at runtime.
 Following setting takes place before this happens.
*/

const REGISTRY_V2V_URL = 'quay.io/nyoxi';
const REGISTRY_V2V_CONVERSION_TAG = '1.12.1-1-gf665c0a';
const REGISTRY_V2V_VMWARE_TAG = '1.12.1-1';

const setDefaultRegistry = () => {
  window.SERVER_FLAGS.registry = window.SERVER_FLAGS.registry || {};

  window.SERVER_FLAGS.registry.v2v = window.SERVER_FLAGS.registry.v2v || {
    url: REGISTRY_V2V_URL, // TODO: should be moved under quay.io/kubevirt
    conversionTag: REGISTRY_V2V_CONVERSION_TAG,
    vmwareTag: REGISTRY_V2V_VMWARE_TAG,
  };
};

export const initKubevirt = () => {
  setDefaultRegistry();
};
