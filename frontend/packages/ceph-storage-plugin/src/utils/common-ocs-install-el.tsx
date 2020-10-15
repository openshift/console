import * as React from 'react';
import { Alert, FormGroup, Switch } from '@patternfly/react-core';
import { ListPage } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import { TechPreviewBadge } from '@console/shared';
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

export const MinimalDeploymentAlert = () => (
  <Alert
    className="co-alert"
    variant="warning"
    title={
      <div className="ceph-minimal-deployment-alert__header">
        A minimal cluster deployment will be performed.
        <TechPreviewBadge />
      </div>
    }
    isInline
  >
    The selected nodes do not match the OCS storage cluster requirement of an aggregated 30 CPUs and
    72 GiB of RAM. If the selection cannot be modified, a minimal cluster will be deployed.
  </Alert>
);

export const SelectNodesSection: React.FC<SelectNodesSectionProps> = ({
  table,
  customData,
  children,
  nameFilterPlaceholder,
  labelFilterPlaceholder,
}) => (
  <>
    <FormGroup fieldId="select-nodes">
      <p>
        {children} It is recommended to start with at least 14 CPUs and 34 GiB per node.
        <div>
          The selected nodes will be labeled with{' '}
          <code>cluster.ocs.openshift.io/openshift-storage=&quot;&quot;</code> (unless they are
          already labeled). 3 of the selected nodes will be used for initial deployment. The
          remaining nodes will be used by OpenShift as scheduling targets for OCS scaling.
        </div>
      </p>

      <ListPage
        kind={NodeModel.kind}
        showTitle={false}
        ListComponent={table}
        customData={customData}
        nameFilterPlaceholder={nameFilterPlaceholder}
        labelFilterPlaceholder={labelFilterPlaceholder}
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

export const EncryptSection: React.FC<EncryptSectionProps> = ({ onToggle, isChecked }) => (
  <>
    <div className="co-m-pane__heading--baseline ceph-ocs-install__pane--margin">
      <h3>Encryption</h3>
      <p className="help-block">Enable data encryption for the OCS storage cluster</p>

      <FormGroup fieldId="toggle-encryption">
        <Switch
          className="ceph-storage-encryption__switch"
          id="ceph-ocs-install__encrytion-switch"
          label="Enabled"
          labelOff="Disabled"
          isChecked={isChecked}
          onChange={() => onToggle(!isChecked)}
        />
      </FormGroup>
    </div>
  </>
);

type EncryptSectionProps = {
  onToggle: (isEncrypted: boolean) => void;
  isChecked: boolean;
};

type SelectNodesSectionProps = {
  table: React.ComponentType<any>;
  customData?: any;
  children?: React.ReactChild;
  nameFilterPlaceholder?: string;
  labelFilterPlaceholder?: string;
};

type StorageClassSectionProps = {
  handleStorageClass: (sc: StorageClassResourceKind) => void;
  filterSC: (sc: StorageClassResourceKind) => boolean;
  children?: React.ReactElement;
};
