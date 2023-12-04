import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { Conditions } from '@console/internal/components/conditions';
import { DetailsPage } from '@console/internal/components/factory';
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
import { VM_DETAIL_SNAPSHOTS } from '../../constants';
import { VIRTUALMACHINES_BASE_URL } from '../../constants/url-params';
import { VirtualMachineModel, VirtualMachineSnapshotModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getName } from '../../selectors';
import {
  getVmRestoreTime,
  getVmSnapshotVmName,
  isVMSnapshotReady,
} from '../../selectors/snapshot/snapshot';
import { VMRestore, VMSnapshot } from '../../types';
import { descriptionModal } from '../modals';
import snapshotRestoreModal from '../modals/snapshot-restore-modal/snapshot-restore-modal';
import { useMappedVMRestores } from './use-mapped-vm-restores';
import { VMSnapshotStatus } from './vm-snapshot-status';

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
  const { t } = useTranslation();
  const relevantRestore = restores[getName(obj)];
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('kubevirt-plugin~Snapshot Details')} />
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={obj} showAnnotations={false}>
              <DetailsItem
                label={t('kubevirt-plugin~Description')}
                obj={obj}
                path={'metadata.annotations.description'}
                canEdit
                editAsGroup
                onEdit={() =>
                  descriptionModal({ resource: obj, kind: VirtualMachineSnapshotModel })
                }
              >
                {obj?.metadata?.annotations?.description || (
                  <div className="text-muted">{t('kubevirt-plugin~Not available')}</div>
                )}
              </DetailsItem>
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <dl className="co-m-pane__details">
              <DetailsItem label={t('kubevirt-plugin~Status')} obj={obj} path="status">
                <VMSnapshotStatus snapshot={obj} restore={relevantRestore} />
              </DetailsItem>
              <dt>{t('kubevirt-plugin~Last Restored')}</dt>
              <dd>
                {relevantRestore ? (
                  <Timestamp timestamp={getVmRestoreTime(relevantRestore)} />
                ) : (
                  t('kubevirt-plugin~Not available')
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('kubevirt-plugin~Conditions')} />
        <Conditions conditions={obj.status?.conditions} />
      </div>
    </>
  );
};

export const SnapshotDetailsPage: React.FC = (props) => {
  const { ns: namespace, name: snapshotName } = useParams();
  const location = useLocation();

  const resource: FirehoseResource = {
    kind: kubevirtReferenceForModel(VirtualMachineSnapshotModel),
    prop: 'snapshot',
    isList: false,
    name: snapshotName,
    namespace,
  };

  const [mappedRelevantRestores, restoresLoaded] = useMappedVMRestores(namespace);

  const pages = [
    {
      href: '',
      // t('kubevirt-plugin~Details')
      nameKey: 'kubevirt-plugin~Details',
      component: SnapshotDetails,
    },
    editYaml(),
  ];

  const breadcrumbsForSnapshots = (snapshot) => {
    const vmName = getVmSnapshotVmName(snapshot);
    const vmReference = kubevirtReferenceForModel(VirtualMachineModel);
    const vmNamespace = namespace || 'default';
    return [
      {
        name: 'Virtualization',
        path: `/k8s/ns/${vmNamespace}/${VIRTUALMACHINES_BASE_URL}`,
      },
      {
        name: 'Virtual Machines',
        path: `/k8s/ns/${vmNamespace}/${VIRTUALMACHINES_BASE_URL}`,
      },
      {
        name: `${vmName} Snapshots`,
        path: `/k8s/ns/${vmNamespace}/${vmReference}/${vmName}/${VM_DETAIL_SNAPSHOTS}`,
      },
      {
        name: `${snapshotName} Details`,
        path: `${location.pathname}`,
      },
    ];
  };

  if (!restoresLoaded) return <LoadingBox />;

  return (
    <DetailsPage
      {...props}
      name={snapshotName}
      namespace={namespace}
      kind={kubevirtReferenceForModel(VirtualMachineSnapshotModel)}
      kindObj={VirtualMachineSnapshotModel}
      resources={[resource]}
      menuActions={menuActions}
      pages={pages}
      breadcrumbsFor={(obj) => breadcrumbsForSnapshots(obj)}
      customData={{ restores: mappedRelevantRestores }}
    />
  );
};

type DetailsProps = { obj: VMSnapshot; customData: { restores: { [key: string]: VMRestore } } };
