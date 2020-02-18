import * as React from 'react';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import {
  Table,
  TableHeader,
  TableBody,
  TableVariant,
  TableGridBreakpoint,
  IRowData,
} from '@patternfly/react-table';
import {
  getNodeRoles,
  getNodeCPUCapacity,
  getNodeAllocatableMemory,
  getName,
} from '@console/shared';
import { Alert, ActionGroup, Button, TextInput, InputGroup } from '@patternfly/react-core';
import { ButtonBar } from '@console/internal/components/utils/button-bar';
import { history } from '@console/internal/components/utils/router';
import {
  FieldLevelHelp,
  humanizeCpuCores,
  ResourceLink,
  FirehoseResult,
  withHandlePromise,
  HandlePromiseProps,
  Firehose,
  Dropdown,
} from '@console/internal/components/utils/';
import { k8sCreate, NodeKind, referenceForModel } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import { OCSServiceModel } from '../../models';
import { minSelectedNode, labelTooltip, ocsRequestData } from '../../constants/ocs-install';
import { OSDSizeDropdown } from '../../utils/osd-size-dropdown';
import { OCSStorageClassDropdown } from '../modals/storage-class-dropdown';
import {
  hasTaints,
  hasOCSTaint,
  hasMinimumCPU,
  hasMinimumMemory,
  getConvertedUnits,
  filterRows,
  hasOCSLabel,
  makeLabelNodesRequest,
} from '../../utils/install';
import { match } from 'react-router';
import { NodeTableRow, FilterMode } from '../../types';
import './ocs-install.scss';

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

const getRows = (nodes: NodeKind[], currNodes: NodeTableRow[]): NodeTableRow[] => {
  return nodes.reduce((acc, node) => {
    if (hasOCSTaint(node) || !hasTaints(node)) {
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
      return [
        ...acc,
        {
          cells,
          selected:
            currNodes.find((curr) => curr?.id === node.metadata.name)?.selected ??
            hasOCSLabel(node),
          id: node.metadata.name,
          metadata: _.clone(node.metadata),
          spec: _.clone(node.spec),
          cpuCapacity,
          allocatableMemory,
        },
      ];
    }
    return acc;
  }, []);
};

const NodeTable = withHandlePromise<CustomNodeTableProps & HandlePromiseProps>(
  React.memo((props) => {
    const columns = getColumns();
    const [osdSize, setOsdSize] = React.useState('2Ti');
    const [storageClass, setStorageClass] = React.useState(null);
    const [nodesWarningMsg, setNodesWarningMsg] = React.useState('');
    const {
      handlePromise,
      match: {
        params: { ns, appName },
      },
      data,
      errorMessage,
      inProgress,
      nodes,
      setNodes,
    } = props;
    const [filterMode, setFilterMode] = React.useState(FilterMode.NAME);
    const [filterInput, setFilterInput] = React.useState('');

    const selectedNodes = React.useMemo<NodeTableRow[]>(
      () => _.filter(nodes, (node) => !!node.selected),
      [nodes],
    );

    React.useEffect(() => {
      if (!data?.loadError) setNodes(getRows(data?.data, nodes));
      // Shallow comparison is not enough
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(data)]);

    const onSelect = (isSelected: boolean, rowData: IRowData) => {
      // When select all is getting pressed
      if (!rowData) {
        setNodes(nodes.map((node) => Object.assign({}, node, { selected: isSelected })));
      } else
        setNodes(
          nodes.reduce(
            (acc: NodeTableRow[], node: NodeTableRow) =>
              node.id === rowData.id
                ? [...acc, Object.assign(node, { selected: !node.selected })]
                : [...acc, node],
            [],
          ),
        );
    };

    const validateNodes = React.useCallback((selNodes: NodeTableRow[]): void => {
      let invalidNodesCount = 0;
      let nodeName = '';
      selNodes.forEach((node: NodeTableRow) => {
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

    // Shallow comparison is not enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
    React.useEffect(() => validateNodes(selectedNodes), [JSON.stringify(nodes)]);

    const makeOCSRequest = () => {
      const selectedData: NodeTableRow[] = _.filter(nodes, 'selected');
      const promises = makeLabelNodesRequest(selectedData);
      const ocsObj = _.cloneDeep(ocsRequestData);
      ocsObj.spec.storageDeviceSets[0].dataPVCTemplate.spec.storageClassName = storageClass;
      ocsObj.spec.storageDeviceSets[0].dataPVCTemplate.spec.resources.requests.storage = osdSize;

      promises.push(k8sCreate(OCSServiceModel, ocsObj));

      handlePromise(Promise.all(promises))
        .then(() => {
          history.push(
            `/k8s/ns/${ns}/clusterserviceversions/${appName}/${referenceForModel(
              OCSServiceModel,
            )}/${getName(ocsObj)}`,
          );
        })
        // eslint-disable-next-line no-console
        .catch((e) => console.error(e));
    };

    const submit = (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      makeOCSRequest();
    };

    return (
      <>
        <div className="ceph-node-list__max-height">
          <InputGroup className="ceph-node-list-search">
            <Dropdown
              items={FilterMode}
              onChange={(v: string) => setFilterMode(FilterMode[v])}
              selectedKey={filterMode}
              title={filterMode}
            />
            <TextInput onChange={(v) => setFilterInput(v)} value={filterInput} />
          </InputGroup>
          <Table
            aria-label="node list table"
            cells={columns}
            rows={filterRows(nodes, filterMode, filterInput)}
            variant={TableVariant.compact}
            gridBreakPoint={TableGridBreakpoint.none}
            onSelect={(event, isSelected, index, rowData) => onSelect(isSelected, rowData)}
          >
            <TableHeader />
            <TableBody />
          </Table>
        </div>
        <p className="control-label help-block" id="nodes-selected">
          {selectedNodes.length} node(s) selected
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
        <ButtonBar errorMessage={errorMessage} inProgress={inProgress}>
          <ActionGroup className="pf-c-form">
            <Button
              type="button"
              variant="primary"
              onClick={submit}
              isDisabled={selectedNodes.length < minSelectedNode}
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
  }),
);

const NodeTableWithFirehose: React.FC<CustomNodeTableWithFirehoseProps> = (props) => {
  const [nodes, setNodes] = React.useState<NodeTableRow[]>([]);
  return (
    <Firehose resources={[{ kind: NodeModel.kind, prop: 'data', isList: true }]}>
      <NodeTable {...props} nodes={nodes} setNodes={setNodes} />
    </Firehose>
  );
};

export default NodeTableWithFirehose;

type CustomNodeTableProps = {
  nodes: NodeTableRow[];
  setNodes: React.Dispatch<React.SetStateAction<NodeTableRow[]>>;
  data?: FirehoseResult<NodeKind[]>;
  match?: match<{ ns: string; appName: string }>;
};

type CustomNodeTableWithFirehoseProps = {
  data?: FirehoseResult<NodeKind[]>;
  match: match<{ ns: string; appName: string }>;
};
