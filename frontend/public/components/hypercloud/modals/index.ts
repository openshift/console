export const statusModal = (props) =>
    import('./status-modal' /* webpackChunkName: "status-modal" */).then((m) => m.statusModal(props));

export const claimModal = (props) =>
    import('./claim-modal' /* webpackChunkName: "claim-modal" */).then((m) => m.claimModal(props));