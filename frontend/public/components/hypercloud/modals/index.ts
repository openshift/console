export const statusModal = (props) =>
    import('./status-modal' /* webpackChunkName: "status-modal" */).then((m) => m.statusModal(props));

export const claimModal = (props) =>
    import('./claim-modal' /* webpackChunkName: "claim-modal" */).then((m) => m.claimModal(props));

export const scanningModal = (props) =>
    import('./scanning-modal' /* webpackChunkName: "scanning-modal" */).then((m) => m.scanningModal(props));

export const configureClusterNodesModal = (props) =>
    import('./configure-count-modal' /* webpackChunkName: "configure-cluster-nodes-modal" */).then((m) =>
        m.configureClusterNodesModal(props),
    );