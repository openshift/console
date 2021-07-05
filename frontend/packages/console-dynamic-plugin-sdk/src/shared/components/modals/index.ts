export const consolePluginModal = (props) =>
  import('./ConsolePluginModal' /* webpackChunkName: "shared-modals" */).then((m) =>
    m.consolePluginModal(props),
  );

export const deleteResourceModal = (props) =>
  import('./DeleteResourceModal' /* webpackChunkName: "shared-modals" */).then((m) =>
    m.deleteResourceModal(props),
  );
