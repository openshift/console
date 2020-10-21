import * as React from 'react';
import * as _ from 'lodash';
import * as cx from 'classnames';
import {
  Alert,
  AlertVariant,
  AlertActionLink,
  WizardContextConsumer,
  FormGroup,
  Switch,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { TechPreviewBadge } from '@console/shared';
import { ListPage } from '@console/internal/components/factory';
import { NodeModel } from '@console/internal/models';
import { FieldLevelHelp } from '@console/internal/components/utils';
import { OCSStorageClassDropdown } from '../components/modals/storage-class-dropdown';
import { StorageClassResourceKind } from '@console/internal/module/k8s/types';
import { MODES } from '../constants';
import { Action } from '../components/ocs-install/attached-devices/create-sc/state';
import { InternalClusterAction } from '../components/ocs-install/internal-mode/reducer';
import { storageClassTooltip, CreateStepsSC } from '../constants/ocs-install';
import '../components/ocs-install/ocs-install.scss';

export type Validation = {
  title: React.ReactNode;
  text: string;
  variant?: keyof typeof AlertVariant;
  link?: string;
  linkText?: string;
  actionLinkText?: string;
  actionLinkStep?: string;
};

enum ValidationType {
  'MINIMAL' = 'MINIMAL',
  'INTERNALSTORAGECLASS' = 'INTERNALSTORAGECLASS',
  'BAREMETALSTORAGECLASS' = 'BAREMETALSTORAGECLASS',
  'ALLREQUIREDFIELDS' = 'ALLREQUIREDFIELDS',
  'MINIMUMNODES' = 'MINIMUMNODES',
  'ENCRYPTION' = 'ENCRYPTION',
  'REQUIRED_FIELD_KMS' = 'REQUIRED_FIELD_KMS',
  'NETWORK' = 'NETWORK',
}

export const VALIDATIONS: { [key in ValidationType]: Validation } = {
  [ValidationType.MINIMAL]: {
    variant: AlertVariant.warning,
    title: (
      <div className="ceph-minimal-deployment-alert__header">
        A minimal cluster deployment will be performed.
        <TechPreviewBadge />
      </div>
    ),
    text:
      'The selected nodes do not match the OCS storage cluster requirement of an aggregated 30 CPUs and 72 GiB of RAM. If the selection cannot be modified, a minimal cluster will be deployed.',
    actionLinkStep: CreateStepsSC.STORAGEANDNODES,
    actionLinkText: 'Back to nodes selection',
  },
  [ValidationType.INTERNALSTORAGECLASS]: {
    variant: AlertVariant.danger,
    title: 'Select a storage class to continue',
    text: `This is a required field. ${storageClassTooltip}`,
    link: '/k8s/cluster/storageclasses/~new/form',
    linkText: 'Create new storage class',
  },
  [ValidationType.BAREMETALSTORAGECLASS]: {
    variant: AlertVariant.danger,
    title: 'Select a storage class to continue',
    text: `This is a required field. ${storageClassTooltip}`,
  },
  [ValidationType.ALLREQUIREDFIELDS]: {
    variant: AlertVariant.danger,
    title: 'All required fields are not set',
    text:
      'In order to create the storage cluster, you must set the storage class, select at least 3 nodes (preferably in 3 different zones) and meet the minimum or recommended requirement',
  },
  [ValidationType.MINIMUMNODES]: {
    variant: AlertVariant.danger,
    title: 'Minimum Node Requirement',
    text:
      'The OCS Storage cluster require a minimum of 3 nodes for the initial deployment. Please choose a different storage class or go to create a new volume set that matches the minimum node requirement.',
    actionLinkText: 'Create new volume set instance',
    actionLinkStep: CreateStepsSC.DISCOVER,
  },
  [ValidationType.ENCRYPTION]: {
    variant: AlertVariant.danger,
    title: 'All required fields are not set',
    text: 'Select at least 1 encryption level or disable encryption.',
  },
  [ValidationType.REQUIRED_FIELD_KMS]: {
    variant: AlertVariant.danger,
    title: 'Fill out the details in order to connect to key management system',
    text: 'This is a required field.',
  },
  [ValidationType.NETWORK]: {
    variant: AlertVariant.danger,
    title: 'Public Network Attachment Definition cannot be empty',
    text: 'To use Multus networking the public Network Attachment Definition must be selected.',
  },
};

export const ActionValidationMessage: React.FC<ValidationMessageProps> = ({
  validation,
  className,
}) => (
  <WizardContextConsumer>
    {({ goToStepById }) => {
      const {
        variant = AlertVariant.info,
        title,
        text,
        actionLinkText,
        actionLinkStep,
      } = validation;
      return (
        <Alert
          className={cx('co-alert', className)}
          variant={variant}
          title={title}
          isInline
          actionLinks={
            <AlertActionLink onClick={() => goToStepById(actionLinkStep)}>
              {actionLinkText}
            </AlertActionLink>
          }
        >
          <p>{text}</p>
        </Alert>
      );
    }}
  </WizardContextConsumer>
);

export const ValidationMessage: React.FC<ValidationMessageProps> = ({ className, validation }) => {
  const { variant = AlertVariant.info, title, text, link, linkText } = validation;
  return (
    <Alert className={cx('co-alert', className)} variant={variant} title={title} isInline>
      <p>{text}</p>
      {link && linkText && <Link to={link}>{linkText}</Link>}
    </Alert>
  );
};

type ValidationMessageProps = {
  className?: string;
  validation: Validation;
};

export const setDispatch = (
  keyType: any,
  valueType: any,
  mode: string,
  dispatch: React.Dispatch<Action | InternalClusterAction>,
) => {
  const stateType = mode === MODES.ATTACHED_DEVICES ? _.camelCase(keyType) : keyType;
  const stateValue =
    mode === MODES.ATTACHED_DEVICES ? { value: valueType } : { payload: valueType };
  dispatch({ type: stateType, ...stateValue });
};

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
      <p id="select-nodes">
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
