import * as React from 'react';
import { Alert, FormGroup } from '@patternfly/react-core';
import { ListPage } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import { OCSStorageClassDropdown } from '../components/modals/storage-class-dropdown';
import { storageClassTooltip } from '../constants/ocs-install';
import '../components/ocs-install/ocs-install.scss';

export const OCSAlert = () => (
  <Alert
    className="co-alert"
    variant="info"
    title="A bucket will be created to provide the OCS Service."
    isInline
  />
);

export const SelectNodesSection: React.FC<SelectNodesSectionProps> = ({ table, customData }) => (
  <>
    <FormGroup fieldId="select-nodes">
      <p>
        Selected nodes will be labeled with{' '}
        <code>cluster.ocs.openshift.io/openshift-storage=&quot;&quot;</code> to create the OCS
        Service.
      </p>
      <p className="co-legend" data-test-id="warning">
        Select at least 3 nodes in different failure domains with minimum requirements of 16 CPUs
        and 64 GiB of RAM per node.
      </p>
      <p>
        3 selected nodes are used for initial deployment. The remaining selected nodes will be used
        by OpenShift as scheduling targets for OCS scaling.
      </p>
      <ListPage
        kind={NodeModel.kind}
        showTitle={false}
        ListComponent={table}
        customData={customData}
      />
    </FormGroup>
  </>
);

export const StorageClassSection: React.FC<StorageClassSectionProps> = ({
  handleStorageClass,
  filterSC,
  children,
}) => (
  <>
    <h3 className="co-m-pane__heading co-m-pane__heading--baseline ceph-ocs-install__pane--margin">
      <div className="co-m-pane__name">Capacity</div>
    </h3>
    <FormGroup
      fieldId="select-sc"
      label={
        <>
          Storage Class
          <FieldLevelHelp>{storageClassTooltip}</FieldLevelHelp>
        </>
      }
    >
      <div className="ceph-ocs-install__ocs-service-capacity--dropdown">
        <OCSStorageClassDropdown
          onChange={handleStorageClass}
          data-test-id="ocs-dropdown"
          filter={filterSC}
        />
      </div>
      {children}
    </FormGroup>
  </>
);

type SelectNodesSectionProps = {
  table: React.ComponentType<any>;
  customData?: any;
};

type StorageClassSectionProps = {
  handleStorageClass: (sc: StorageClassResourceKind) => void;
  filterSC: (sc: StorageClassResourceKind) => boolean;
  children?: React.ReactElement;
};
