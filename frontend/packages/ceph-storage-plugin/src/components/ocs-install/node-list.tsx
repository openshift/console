import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { connect } from 'react-redux';
import {
  Table,
  TableHeader,
  TableBody,
  TableVariant,
  TableGridBreakpoint,
} from '@patternfly/react-table';
import {
  getName,
  getNodeRoles,
  getNodeCPUCapacity,
  getNodeAllocatableMemory,
} from '@console/shared';
import { Alert, ActionGroup, Button } from '@patternfly/react-core';
import { tableFilters } from '@console/internal/components/factory/table-filters';
import { ButtonBar } from '@console/internal/components/utils/button-bar';
import { history } from '@console/internal/components/utils/router';
import {
  convertToBaseValue,
  FieldLevelHelp,
  humanizeCpuCores,
  humanizeBinaryBytes,
  ResourceLink,
} from '@console/internal/components/utils/';
import {
  k8sCreate,
  k8sPatch,
  K8sResourceKind,
  NodeKind,
  referenceForModel,
  Taint,
} from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { OCSServiceModel } from '../../models';
import {
  minSelectedNode,
  labelTooltip,
  ocsRequestData,
  ocsTaint,
} from '../../constants/ocs-install';
import './ocs-install.scss';
import { OSDSizeDropdown } from '../../utils/osd-size-dropdown';
import { hasLabel } from '../../../../console-shared/src/selectors/common';
import { OCSStorageClassDropdown } from '../modals/storage-class-dropdown';

const ocsLabel = 'cluster.ocs.openshift.io/openshift-storage';

const getConvertedUnits = (value: string) => {
  return humanizeBinaryBytes(convertToBaseValue(value)).string || '-';
};

const tableColumnClasses = [
  classNames('col-md-1', 'col-sm-1', 'col-xs-1'),
  classNames('col-md-4', 'col-sm-8', 'col-xs-11'),
  classNames('col-md-2', 'col-sm-3', 'hidden-xs'),
  classNames('col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-1', 'hidden-sm', 'hidden-xs'),
  classNames('col-md-2', 'hidden-sm', 'hidden-xs'),
];

const getColumns = () => {
  return [
    {
      title: 'Name',
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Role',
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Location',
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'CPU',
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Memory',
      props: { className: tableColumnClasses[5] },
    },
  ];
};

const hasTaints = (node: NodeKind) => {
  return !_.isEmpty(node.spec.taints);
};

const hasOCSTaint = (node: NodeKind) => {
  const taints: Taint[] = node.spec.taints || [];
  return taints.some((taint: Taint) => _.isEqual(taint, ocsTaint));
};

// return an empty array when there is no data
const getRows = (nodes: NodeKind[]) => {
  return nodes
    .filter((node) => hasOCSTaint(node) || !hasTaints(node))
    .map((node) => {
      const roles = getNodeRoles(node).sort();
      const cpuCapacity: string = getNodeCPUCapacity(node);
      const allocatableMemory: string = getNodeAllocatableMemory(node);
      const cells = [
        {
          title: <ResourceLink kind="Node" name={node.metadata.name} title={node.metadata.uid} />,
        },
        {
          title: roles.join(', ') || '-',
        },
        {
          title: _.get(node.metadata.labels, 'failure-domain.beta.kubernetes.io/zone') || '-',
        },
        {
          title: `${humanizeCpuCores(cpuCapacity).string || '-'}`,
        },
        {
          title: `${getConvertedUnits(allocatableMemory)}`,
        },
      ];
      const obj = {
        cells,
        selected: false,
        id: node.metadata.name,
        metadata: _.clone(node.metadata),
        spec: _.clone(node.spec),
        cpuCapacity,
        allocatableMemory,
      };

      return obj;
    });
};

const getFilteredRows = (filters: {}, objects: any[]) => {
  if (_.isEmpty(filters)) {
    return objects;
  }

  let filteredObjects = objects;
  _.each(filters, (value, name) => {
    const filter = tableFilters[name];
    if (_.isFunction(filter)) {
      filteredObjects = _.filter(filteredObjects, (o) => filter(value, o));
    }
  });

  return filteredObjects;
};

const getPreSelectedNodes = (nodes: formattedNodeType[]) => {
  return nodes.map((node) => ({
    ...node,
    selected: _.has(node, ['metadata', 'labels', ocsLabel]),
  }));
};

const stateToProps = (obj, { data = [], filters = {}, staticFilters = [{}] }) => {
  const allFilters = staticFilters ? Object.assign({}, filters, ...staticFilters) : filters;
  const newData = getFilteredRows(allFilters, data);
  return {
    data: newData,
    unfilteredData: data,
    isFiltered: !!_.get(filters, 'name'),
  };
};
const CustomNodeTable: React.FC<CustomNodeTableProps> = ({
  data,
  unfilteredData,
  isFiltered,
  loaded,
  ocsProps,
}) => {
  const columns = getColumns();
  const [osdSize, setOsdSize] = React.useState('2Ti');
  const [nodes, setNodes] = React.useState([]);
  const [unfilteredNodes, setUnfilteredNodes] = React.useState([]);
  const [error, setError] = React.useState('');
  const [inProgress, setProgress] = React.useState(false);
  const [selectedNodesCnt, setSelectedNodesCnt] = React.useState(0);
  const [nodesWarningMsg, setNodesWarningMsg] = React.useState('');
  const [storageClass, setStorageClass] = React.useState(null);

  // pre-selection of nodes
  if (loaded && !unfilteredNodes.length) {
    const formattedNodes: formattedNodeType[] = getRows(unfilteredData);
    const preSelectedNodes = getPreSelectedNodes(formattedNodes);
    setUnfilteredNodes(preSelectedNodes);
    setNodes(preSelectedNodes);
  }

  const hasMinimumCPU = (node: formattedNodeType): boolean => {
    return convertToBaseValue(node.cpuCapacity) >= 16;
  };

  const hasMinimumMemory = (node: formattedNodeType): boolean => {
    return convertToBaseValue(node.allocatableMemory) >= convertToBaseValue('64 Gi');
  };

  const validateNodes = React.useCallback((selectedNodes: formattedNodeType[]): void => {
    let invalidNodesCount = 0;
    let nodeName = '';
    selectedNodes.forEach((node: formattedNodeType) => {
      if (!hasMinimumCPU(node) || !hasMinimumMemory(node)) {
        invalidNodesCount += 1;
        nodeName = node.id;
      }
    });

    if (invalidNodesCount > 0) {
      const msg =
        invalidNodesCount > 1
          ? `${invalidNodesCount} of the selected nodes do not meet minimum requirements of 16 cores and 64 GiB Memory`
          : `Node ${nodeName} does not meet minimum requirements of 16 cores and 64 GiB memory.`;
      setNodesWarningMsg(msg);
    } else {
      setNodesWarningMsg('');
    }
  }, []);

  React.useEffect(() => {
    const selectedNodes = _.filter(unfilteredNodes, 'selected');
    setSelectedNodesCnt(selectedNodes.length);
    validateNodes(selectedNodes);
  }, [nodes, unfilteredNodes, validateNodes]);

  React.useEffect(() => {
    if (isFiltered || nodes.length !== data.length) {
      const unfilteredNodesByID = _.keyBy(unfilteredNodes, 'metadata.name');
      const filterData = _.each(getRows(data), (n) => {
        n.selected = _.get(unfilteredNodesByID, [n.id, 'selected'], false);
      });
      setNodes(filterData);
    }
  }, [data, isFiltered, nodes.length, unfilteredNodes]);
  const onSelect = (
    event: React.MouseEvent<HTMLButtonElement>,
    isSelected: boolean,
    index: number,
  ) => {
    event.stopPropagation();
    let formattedNodes;
    if (index === -1) {
      formattedNodes = nodes.map((node) => {
        node.selected = isSelected;
        return node;
      });
    } else {
      formattedNodes = [...nodes];
      formattedNodes[index].selected = isSelected;
    }
    setNodes(formattedNodes);
    const nodesByID = _.keyBy(nodes, 'id');
    const setSelectedUnfilteredNodes = _.each(unfilteredNodes, (n) => {
      if (_.get(nodesByID, [n.id, 'id']) === n.metadata.name) {
        n.selected = _.get(nodesByID, [getName(n), 'selected'], false);
      }
    });
    setUnfilteredNodes(setSelectedUnfilteredNodes);
  };

  const makeLabelNodesRequest = (selectedNodes: NodeKind[]): Promise<NodeKind>[] => {
    const patch = [
      {
        op: 'add',
        path: '/metadata/labels/cluster.ocs.openshift.io~1openshift-storage',
        value: '',
      },
    ];
    return _.reduce(
      selectedNodes,
      (accumulator, node) => {
        return hasLabel(node, ocsLabel)
          ? accumulator
          : [...accumulator, k8sPatch(NodeModel, node, patch)];
      },
      [],
    );
  };

  // tainting the selected nodes
  // const makeTaintNodesRequest = (selectedNode: NodeKind[]): Promise<NodeKind>[] => {
  //   const taintNodesRequest = selectedNode
  //     .filter((node: NodeKind) => {
  //       const roles = getNodeRoles(node);
  //       // don't taint master nodes as its already tainted
  //       return roles.indexOf('master') === -1;
  //     })
  //     .map((node) => {
  //       const taints = node.spec && node.spec.taints ? [...node.spec.taints, taintObj] : [taintObj];
  //       const patch = [
  //         {
  //           value: taints,
  //           path: '/spec/taints',
  //           op: node.spec.taints ? 'replace' : 'add',
  //         },
  //       ];
  //       return k8sPatch(NodeModel, node, patch);
  //     });

  //   return taintNodesRequest;
  // };

  const makeOCSRequest = () => {
    const selectedData: NodeKind[] = _.filter(nodes, 'selected');
    const promises = makeLabelNodesRequest(selectedData);
    // intentionally keeping the taint logic as its required in 4.3 and will be handled with checkbox selection
    // promises.push(...makeTaintNodesRequest(selectedData));

    const ocsObj = _.cloneDeep(ocsRequestData);
    ocsObj.spec.storageDeviceSets[0].dataPVCTemplate.spec.storageClassName = storageClass;
    ocsObj.spec.storageDeviceSets[0].dataPVCTemplate.spec.resources.requests.storage = osdSize;

    Promise.all(promises)
      .then(() => {
        return k8sCreate(OCSServiceModel, ocsObj);
      })
      .then(() => {
        history.push(
          `/k8s/ns/${ocsProps.namespace}/clusterserviceversions/${
            ocsProps.clusterServiceVersion.metadata.name
          }/${referenceForModel(OCSServiceModel)}/${ocsObj.metadata.name}`,
        );
      })
      .catch((err) => {
        setProgress(false);
        setError(err.message);
      });
  };

  const submit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setProgress(true);
    setError('');
    makeOCSRequest();
  };

  return (
    <>
      <div className="ceph-node-list__max-height">
        <Table
          aria-label="node list table"
          onSelect={onSelect}
          cells={columns}
          rows={nodes}
          variant={TableVariant.compact}
          gridBreakPoint={TableGridBreakpoint.none}
        >
          <TableHeader />
          <TableBody />
        </Table>
      </div>
      <p className="control-label help-block" id="nodes-selected">
        {selectedNodesCnt} node(s) selected
      </p>
      {nodesWarningMsg.length > 0 && (
        <Alert
          className="co-alert ceph-ocs-install__alert"
          variant="warning"
          title={nodesWarningMsg}
          isInline
        />
      )}
      <div className="ceph-ocs-install__ocs-service-capacity--dropdown">
        <OCSStorageClassDropdown onChange={setStorageClass} />
      </div>
      <div className="ceph-ocs-install__ocs-service-capacity">
        <label className="control-label" htmlFor="ocs-service-stoargeclass">
          OCS Service Capacity
          <FieldLevelHelp>{labelTooltip}</FieldLevelHelp>
        </label>
        <OSDSizeDropdown
          className="ceph-ocs-install__ocs-service-capacity--dropdown"
          selectedKey={osdSize}
          onChange={setOsdSize}
        />
      </div>
      <ButtonBar errorMessage={error} inProgress={inProgress}>
        <ActionGroup className="pf-c-form">
          <Button
            type="button"
            variant="primary"
            onClick={submit}
            isDisabled={selectedNodesCnt < minSelectedNode}
          >
            Create
          </Button>
          <Button type="button" variant="secondary" onClick={history.goBack}>
            Cancel
          </Button>
        </ActionGroup>
      </ButtonBar>
    </>
  );
};

export const NodeList = connect<{}, CustomNodeTableProps>(stateToProps)(CustomNodeTable);

type CustomNodeTableProps = {
  data: NodeKind[];
  unfilteredData: UnfilteredDataType[];
  loaded: boolean;
  ocsProps: ocsPropsType;
  isFiltered: boolean;
};

type ocsPropsType = {
  namespace: string;
  clusterServiceVersion: K8sResourceKind;
};

type UnfilteredDataType = NodeKind & {
  selected: boolean;
};

type formattedNodeType = {
  cells: any[];
  selected: boolean;
  id: string;
  metadata: {};
  spec: {};
  cpuCapacity: string;
  allocatableMemory: string;
};
