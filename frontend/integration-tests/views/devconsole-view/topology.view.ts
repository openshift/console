import { by, element } from 'protractor';

// The top-level topology container
export const topologyContainer = element(
  by.className('pf-l-stack__item pf-m-fill pf-topology-container__with-sidebar'),
  );

// The topology content
export const topologyContent = element(
  by.className('pf-topology-content'),
  );

// The topology graph
export const topologyGraph = element(
  by.className('odc-graph'),
  );

// The topology controlbar
export const topologyToolbar = element(
  by.className('pf-topology-control-bar'),
  );


// Elements in the topology graph



export const baseNodes = element.all(
  by.className('odc-base-node__contents'),
);

export const baseNodeLabels = element.all(
  by.className('odc-base-node__label'),
);

export const defaultGroupLabels = element.all(
  by.className('odc-default-group__label'),
);

export const deploymentConfigs = element.all(
  by.className('odc-resource-icon odc-resource-icon-deploymentconfig'),
);


// Elements in the topology controlbar




