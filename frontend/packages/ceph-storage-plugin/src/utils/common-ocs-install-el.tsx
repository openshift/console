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

type MinimalDeploymentAlertProps = {
  isInternalMode?: boolean;
};

export const MinimalDeploymentAlert: React.FC<MinimalDeploymentAlertProps> = ({
  isInternalMode,
}) => (
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
    {isInternalMode
      ? 'The selected nodes do not match the OCS storage cluster recommended requirements of an aggregated 30 CPUs and 72 GiB of RAM. If the selection won’t be modified, a minimal cluster will be deployed and may face some performance issues.'
      : 'The selected nodes do not match the OCS storage cluster recommended requirements of at least 10 CPU and 64 GiB of RAM per node. If the selection won’t be modified, a minimal cluster will be deployed and may face some performance issues.'}
  </Alert>
);

export const SelectNodesSection: React.FC<SelectNodesSectionProps> = ({
  table,
  customData,
  children,
}) => (
  <>
    <FormGroup fieldId="select-nodes">
      <p>
        {children}
        The selected nodes will be labeled with{' '}
        <code>cluster.ocs.openshift.io/openshift-storage=&quot;&quot;</code> to create the OCS
        cluster and 3 of the selected nodes will be used for initial deployment. The other selected
        nodes will be used by OpenShift as scheduling targets for OCS scaling.
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
};

type StorageClassSectionProps = {
  handleStorageClass: (sc: StorageClassResourceKind) => void;
  filterSC: (sc: StorageClassResourceKind) => boolean;
  children?: React.ReactElement;
};
