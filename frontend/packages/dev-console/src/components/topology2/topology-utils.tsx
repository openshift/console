import * as React from 'react';
import { EdgeModel, Edge, Model, NodeModel, Node, NodeShape } from '@console/topology';
import { confirmModal, errorModal } from '@console/internal/components/modals';
import { YellowExclamationTriangleIcon } from '@console/shared/src/components/status/icons';
import { TopologyDataModel } from '../topology/topology-types';
import {
  createTopologyResourceConnection,
  removeTopologyResourceConnection,
  updateTopologyResourceApplication,
} from '../topology/topology-utils';
import { TYPE_APPLICATION_GROUP, TYPE_KNATIVE_SERVICE } from './const';

const topologyModelFromDataModel = (dataModel: TopologyDataModel): Model => {
  const nodes: NodeModel[] = dataModel.graph.nodes.map((d) => {
    if (d.type === TYPE_KNATIVE_SERVICE) {
      return {
        width: 104,
        height: 104,
        id: d.id,
        type: d.type,
        label: dataModel.topology[d.id].name,
        data: dataModel.topology[d.id],
        children: (d as any).children,
        group: true,
        shape: NodeShape.rect,
        style: {
          padding: [40, 50, 40, 40],
        },
      };
    }
    return {
      width: 104,
      height: 104,
      id: d.id,
      type: d.type,
      label: dataModel.topology[d.id].name,
      data: dataModel.topology[d.id],
    };
  });

  const groupNodes: NodeModel[] = dataModel.graph.groups.map((d) => {
    return {
      id: d.id,
      group: true,
      type: TYPE_APPLICATION_GROUP,
      data: dataModel.topology[d.id],
      children: d.nodes,
      label: d.name,
      style: {
        padding: 40,
      },
    };
  });

  // create links from data
  const edges = dataModel.graph.edges.map(
    (d): EdgeModel => ({
      data: d,
      source: d.source,
      target: d.target,
      id: `${d.source}_${d.target}`,
      type: d.type,
    }),
  );

  // create topology model
  const model: Model = {
    nodes: [...nodes, ...groupNodes],
    edges,
  };

  return model;
};

const moveNodeToGroup = (node: Node, targetGroup: Node): Promise<void> => {
  const sourceGroup = node.getParent() !== node.getGraph() ? (node.getParent() as Node) : undefined;
  if (sourceGroup === targetGroup) {
    return Promise.reject();
  }

  if (sourceGroup) {
    const title = targetGroup ? 'Move Component Node' : 'Remove Component Node from Application';
    const message = (
      <>
        Are you sure you want to {targetGroup ? 'move' : 'remove'}{' '}
        <strong>{node.getLabel()}</strong> from {sourceGroup.getLabel()}
        {targetGroup ? ` to ${targetGroup.getLabel()}` : ''}?
      </>
    );
    const btnText = targetGroup ? 'Move' : 'Remove';

    return new Promise((resolve, reject) => {
      confirmModal({
        title,
        message,
        btnText,
        cancel: () => {
          reject();
        },
        executeFn: () => {
          return updateTopologyResourceApplication(
            node.getData(),
            targetGroup ? targetGroup.getLabel() : null,
          )
            .then(resolve)
            .catch((err) => {
              const error = err.message;
              errorModal({ error });
              reject(err);
            });
        },
      });
    });
  }

  return updateTopologyResourceApplication(node.getData(), targetGroup.getLabel()).catch((err) => {
    const error = err.message;
    errorModal({ error });
  });
};

const createConnection = (
  sourceNode: Node,
  targetNode: Node,
  replaceTargetNode: Node = null,
  serviceBindingFlag: boolean,
): Promise<any> => {
  return createTopologyResourceConnection(
    sourceNode.getData(),
    targetNode.getData(),
    replaceTargetNode ? replaceTargetNode.getData() : null,
    serviceBindingFlag,
  );
};

const removeConnection = (edge: Edge): Promise<any> => {
  const message = (
    <div className="co-delete-modal">
      <YellowExclamationTriangleIcon className="co-delete-modal__icon" />
      {edge.getType() === 'service-binding' ? (
        <p>
          Deleting the binding connector deletes the config details of the source and removes the
          binding resources. Are you sure you want to delete the binding connector?
        </p>
      ) : (
        <p>
          Deleting the visual connector removes the `connects-to` annotation from the resources. Are
          you sure you want to delete the visual connector?
        </p>
      )}
    </div>
  );

  return confirmModal({
    title: 'Delete Connector',
    message,
    btnText: 'Delete',
    submitDanger: true,
    executeFn: () => {
      return removeTopologyResourceConnection(
        edge.getSource().getData(),
        edge.getTarget().getData(),
        edge.getData().data && edge.getData().data.sbr,
        edge.getType(),
      ).catch((err) => {
        err && errorModal({ error: err.message });
      });
    },
  });
};

export { topologyModelFromDataModel, moveNodeToGroup, createConnection, removeConnection };
