// This module utilizes dynamic `import()` to enable lazy-loading for each modal instead of including them in the main bundle.

// Helper to detect if a modal is open. This is used to disable autofocus in elements under a modal.
// TODO: Improve focus and keybinding handling, see https://issues.redhat.com/browse/ODC-3554
export const isModalOpen = () => document.body.classList.contains('ReactModal__Body--open');

export const configureCountModal = (props) =>
  import('./configure-count-modal' /* webpackChunkName: "configure-count-modal" */).then((m) =>
    m.configureCountModal(props),
  );

export const configureReplicaCountModal = (props) =>
  import('./configure-count-modal' /* webpackChunkName: "configure-count-modal" */).then((m) =>
    m.configureReplicaCountModal(props),
  );

export const configureJobParallelismModal = (props) =>
  import('./configure-count-modal' /* webpackChunkName: "configure-count-modal" */).then((m) =>
    m.configureJobParallelismModal(props),
  );

export const confirmModal = (props) =>
  import('./confirm-modal' /* webpackChunkName: "confirm-modal" */).then((m) =>
    m.confirmModal(props),
  );

export const createNamespaceModal = (props) =>
  import('./create-namespace-modal' /* webpackChunkName: "create-namespace-modal" */).then((m) =>
    m.createNamespaceModal(props),
  );

export const createProjectModal = (props) =>
  import('./create-namespace-modal' /* webpackChunkName: "create-namespace-modal" */).then((m) =>
    m.createProjectModal(props),
  );

export const deleteNamespaceModal = (props) =>
  import('./delete-namespace-modal' /* webpackChunkName: "delete-namespace-modal" */).then((m) =>
    m.deleteNamespaceModal(props),
  );

export const errorModal = (props) =>
  import('./error-modal' /* webpackChunkName: "error-modal" */).then((m) => m.errorModal(props));

export const configureNamespacePullSecretModal = (props) =>
  import(
    './configure-ns-pull-secret-modal' /* webpackChunkName: "configure-ns-pull-secret-modal" */
  ).then((m) => m.configureNamespacePullSecretModal(props));

export const labelsModal = (props) =>
  import('./labels-modal' /* webpackChunkName: "labels-modal" */).then((m) => m.labelsModal(props));

export const podSelectorModal = (props) =>
  import('./labels-modal' /* webpackChunkName: "labels-modal" */).then((m) =>
    m.podSelectorModal(props),
  );

export const configureUpdateStrategyModal = (props) =>
  import(
    './configure-update-strategy-modal' /* webpackChunkName: "configure-update-strategy-modal" */
  ).then((m) => m.configureUpdateStrategyModal(props));

export const annotationsModal = (props) =>
  import('./tags' /* webpackChunkName: "tags" */).then((m) => m.annotationsModal(props));

export const deleteModal = (props) =>
  import('./delete-modal' /* webpackChunkName: "delete-modal" */).then((m) => m.deleteModal(props));

export const clusterChannelModal = (props) =>
  import('./cluster-channel-modal' /* webpackChunkName: "cluster-channel-modal" */).then((m) =>
    m.clusterChannelModal(props),
  );

export const clusterMoreUpdatesModal = (props) =>
  import(
    './cluster-more-updates-modal' /* webpackChunkName: "cluster-more-updates-modal" */
  ).then((m) => m.clusterMoreUpdatesModal(props));

export const clusterUpdateModal = (props) =>
  import('./cluster-update-modal' /* webpackChunkName: "cluster-update-modal" */).then((m) =>
    m.clusterUpdateModal(props),
  );

export const taintsModal = (props) =>
  import('./taints-modal' /* webpackChunkName: "taints-modal" */).then((m) => m.taintsModal(props));

export const tolerationsModal = (props) =>
  import('./tolerations-modal' /* webpackChunkName: "tolerations-modal" */).then((m) =>
    m.tolerationsModal(props),
  );

export const expandPVCModal = (props) =>
  import('./expand-pvc-modal' /* webpackChunkName: "expand-pvc-modal" */).then((m) =>
    m.expandPVCModal(props),
  );

export const clonePVCModal = (props) =>
  import(
    '@console/app/src/components/modals/clone/clone-pvc-modal' /* webpackChunkName: "clone-pvc-modal" */
  ).then((m) => m.default(props));

export const removeVolumeModal = (props) =>
  import('./remove-volume-modal' /* webpackChunkName: "remove-volume-modal" */).then((m) =>
    m.removeVolumeModal(props),
  );

export const configureMachineAutoscalerModal = (props) =>
  import(
    './configure-machine-autoscaler-modal' /* webpackChunkName: "configure-machine-autoscaler-modal" */
  ).then((m) => m.configureMachineAutoscalerModal(props));

export const createAlertRoutingModal = (props) =>
  import('./alert-routing-modal' /* webpackChunkName: "alert-routing-modal" */).then((m) =>
    m.createAlertRoutingModal(props),
  );

export const createColumnManagementModal = (props) =>
  import('./column-management-modal' /* webpackChunkName: "column-management-modal" */).then((m) =>
    m.createColumnManagementModal(props),
  );

export const addUsersModal = (props) =>
  import('./add-users-modal' /* webpackChunkName: "add-users-modal" */).then((m) =>
    m.addUsersModal(props),
  );

export const removeUserModal = (props) =>
  import('./remove-user-modal' /* webpackChunkName: "remove-user-modal" */).then((m) =>
    m.removeUserModal(props),
  );
