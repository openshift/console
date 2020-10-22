import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import {
  DetailsItem,
  FirehoseResource,
  Kebab,
  LoadingBox,
  navFactory,
  ResourceSummary,
  SectionHeading,
  Timestamp,
} from '@console/internal/components/utils';
import { getName } from '@console/shared';
import { Conditions } from '@console/internal/components/conditions';
import { DetailsPage } from '@console/internal/components/factory';
import snapshotRestoreModal from '../modals/snapshot-restore-modal/snapshot-restore-modal';
import { VirtualMachineSnapshotModel } from '../../models';
import { VMRestore, VMSnapshot } from '../../types';
import {
  getVmRestoreTime,
  getVmSnapshotVmName,
  isVMSnapshotReady,
} from '../../selectors/snapshot/snapshot';
import { VMSnapshotStatus } from './vm-snapshot-status';
import { VM_DETAIL_SNAPSHOTS } from '../../constants';
import { NOT_AVAILABLE_MESSAGE } from '../../strings/vm/messages';
import { useMappedVMRestores } from './use-mapped-vm-restores';
import { descriptionModal } from '../modals';

const { editYaml } = navFactory;
const { common } = Kebab.factory;
const menuActions = [
  (kind, snapshot) => ({
    label: `Restore ${kind.label}`,
    isDisabled: !isVMSnapshotReady(snapshot),
    callback: () => snapshotRestoreModal({ snapshot }),
  }),
  ...common,
];

const SnapshotDetails: React.FC<DetailsProps> = ({ obj, customData: { restores } }) => {
  const relevantRestore = restores[getName(obj)];
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text="Snapshot Details" />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj} showAnnotations={false}>
              <DetailsItem
                label="Description"
                obj={obj}
                path={'metadata.annotations.description'}
                canEdit
                editAsGroup
                onEdit={() =>
                  descriptionModal({ resource: obj, kind: VirtualMachineSnapshotModel })
                }
              >
                {obj?.metadata?.annotations?.description || (
                  <div className="text-muted">{NOT_AVAILABLE_MESSAGE}</div>
                )}
              </DetailsItem>
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <DetailsItem label="Status" obj={obj} path="status">
                <VMSnapshotStatus snapshot={obj} restore={relevantRestore} />
              </DetailsItem>
              <dt>Last Restored</dt>
              <dd>
                {relevantRestore ? (
                  <Timestamp timestamp={getVmRestoreTime(relevantRestore)} />
                ) : (
                  NOT_AVAILABLE_MESSAGE
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={obj.status?.conditions} />
      </div>
    </>
  );
};

export const SnapshotDetailsPage: React.FC<SnapshotDetailsPageProps> = ({ match, ...props }) => {
  const { ns: namespace, name: snapshotName } = match.params;

  const resource: FirehoseResource = {
    kind: VirtualMachineSnapshotModel.kind,
    prop: 'snapshot',
    isList: false,
    name: snapshotName,
    namespace,
  };

  const [mappedRelevantRestores, restoresLoaded] = useMappedVMRestores(namespace);

  const pages = [
    {
      href: '',
      name: 'Details',
      component: SnapshotDetails,
    },
    editYaml(),
  ];

  const breadcrumbsForSnapshots = (snapshot) => {
    const vmName = getVmSnapshotVmName(snapshot);
    const vmNamespace = namespace || 'default';
    return [
      {
        name: 'Virtualization',
        path: `/k8s/ns/${vmNamespace}/virtualization`,
      },
      {
        name: 'Virtual Machines',
        path: `/k8s/ns/${vmNamespace}/virtualization`,
      },
      {
        name: `${vmName} Snapshots`,
        path: `/k8s/ns/${vmNamespace}/virtualmachines/${vmName}/${VM_DETAIL_SNAPSHOTS}`,
      },
      {
        name: `${snapshotName} Details`,
        path: `${match.url}`,
      },
    ];
  };

  if (!restoresLoaded) return <LoadingBox />;

  return (
    <DetailsPage
      {...props}
      match={match}
      name={snapshotName}
      namespace={namespace}
      kind={VirtualMachineSnapshotModel.kind}
      kindObj={VirtualMachineSnapshotModel}
      resources={[resource]}
      menuActions={menuActions}
      pages={pages}
      breadcrumbsFor={(obj) => breadcrumbsForSnapshots(obj)}
      customData={{ restores: mappedRelevantRestores }}
    />
  );
};
type SnapshotDetailsPageProps = RouteComponentProps<{ ns?: string; name?: string }>;

type DetailsProps = { obj: VMSnapshot; customData: { restores: { [key: string]: VMRestore } } };
