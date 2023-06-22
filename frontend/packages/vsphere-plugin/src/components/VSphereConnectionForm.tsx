import * as React from 'react';
import {
  EmptyState,
  EmptyStateIcon,
  Form,
  FormGroup,
  Spinner,
  TextInput,
} from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { useConnectionForm } from '../hooks/use-connection-form';
import { PopoverHelpButton } from '../PopoverHelpButton';
import { VSphereConnectionProps } from './types';

import './VSphereConnectionForm.css';

export const VSphereConnectionForm: React.FC<Pick<
  VSphereConnectionProps,
  'cloudProviderConfig'
>> = ({ cloudProviderConfig }) => {
  const { t } = useTranslation('vsphere-plugin');
  const vcenterRef = React.useRef<HTMLInputElement>(null);

  const { setters, values, isLoaded } = useConnectionForm(cloudProviderConfig);

  React.useEffect(() => {
    vcenterRef?.current?.focus();
  }, []);

  const folderHelperText = (
    <Trans t={t}>
      Provide <b>datacenter</b> folder which contains VMs of the cluster, example: /
      <span className="plugin-vsphere-form-helper__datacenter">
        {{ datacenter: values.datacenter }}
      </span>
      /<b>vm</b>/<b>[MY_VMS_TOP_FOLDER]</b>.
    </Trans>
  );

  const datacenterHelperText = (
    <>
      <Trans t={t}>
        Enter the name of the vSphere data center that contains the virtual machines currently
        backing-up the cluster.
      </Trans>
      <br />
      <strong>
        <Trans t={t}>
          Warning: Updating this value once the configuration has been saved will detach any
          existing PersistentVolumes.
        </Trans>
      </strong>
    </>
  );

  const datastoreHelperText = (
    <>
      <Trans t={t}>
        Select the data store in the vSphere data center that is to store the persistent data
        volumes.
      </Trans>
      <br />
      <strong>
        <Trans t={t}>Warning: Updating this value will break any existing PersistentVolumes.</Trans>
      </strong>
    </>
  );

  if (!isLoaded) {
    return (
      <EmptyState>
        <EmptyStateIcon icon={Spinner} />
      </EmptyState>
    );
  }

  return (
    <Form id="vsphere-connection-modal-form">
      <FormGroup
        label={t('vCenter')}
        labelIcon={
          <PopoverHelpButton
            content={
              <>
                {t(
                  'Enter the network address of the vCenter server. It can either be a domain name or IP address. It appears in the vSphere web client URL. Example:  ',
                )}
                <ul>
                  <li>https://[your_vCenter_address]/ui</li>
                </ul>
              </>
            }
          />
        }
        isRequired
        fieldId="connection-vcenter"
        helperText={t('Can be either domain name or IP address. See tooltip for details.')}
      >
        <TextInput
          isRequired
          type="text"
          id="connection-vcenter"
          name="vcenter"
          aria-describedby="connection-vcenter-helper"
          value={values.vcenter}
          onChange={setters.setVcenter}
          ref={vcenterRef}
        />
      </FormGroup>
      <FormGroup
        label={t('vCenter cluster')}
        isRequired
        fieldId="connection-vcenter-cluster"
        labelIcon={
          <PopoverHelpButton
            content={t(
              'Enter the name of the vSphere vCenter cluster where OpenShift Container Platform is installed.',
            )}
          />
        }
      >
        <TextInput
          isRequired
          type="text"
          id="connection-vcenter-cluster"
          name="vcentercluster"
          value={values.vCenterCluster}
          onChange={setters.setVCenterCluster}
        />
      </FormGroup>
      <FormGroup
        label={t('Username')}
        isRequired
        fieldId="connection-username"
        labelIcon={
          <PopoverHelpButton
            content={t(
              'Enter the vSphere vCenter username. An incorrect username will render the cluster nodes unschedulable (known issue: OCPBUGS-2353).',
            )}
          />
        }
      >
        <TextInput
          isRequired
          type="text"
          id="connection-username"
          name="username"
          value={values.username}
          onChange={setters.setUsername}
        />
      </FormGroup>
      <FormGroup
        label={t('Password')}
        labelIcon={
          <PopoverHelpButton
            content={t(
              'Enter the vSphere vCenter password. The password will be stored in a Secret in the kube-system namespace for this cluster. An incorrect password will render the cluster nodes unschedulable (known issue: OCPBUGS-2353).',
            )}
          />
        }
        isRequired
        fieldId="connection-password"
      >
        <TextInput
          isRequired
          type="password"
          id="connection-password"
          name="password"
          value={values.password}
          onChange={setters.setPassword}
        />
      </FormGroup>
      <FormGroup
        label={t('Datacenter')}
        labelIcon={<PopoverHelpButton content={datacenterHelperText} />}
        isRequired
        fieldId="connection-datacenter"
      >
        <TextInput
          isRequired
          type="text"
          id="connection-datacenter"
          name="datacenter"
          value={values.datacenter}
          onChange={setters.setDatacenter}
        />
      </FormGroup>
      <FormGroup
        label={t('Default data store')}
        labelIcon={<PopoverHelpButton content={datastoreHelperText} />}
        isRequired
        fieldId="connection-defaultdatastore"
      >
        <TextInput
          isRequired
          type="text"
          id="connection-defaultdatastore"
          name="defaultdatastore"
          value={values.defaultDatastore}
          onChange={setters.setDefaultDatastore}
        />
      </FormGroup>
      <FormGroup
        label={t('Virtual Machine Folder')}
        labelIcon={<PopoverHelpButton content={folderHelperText} />}
        isRequired
        fieldId="connection-folder"
      >
        <TextInput
          isRequired
          type="text"
          id="connection-folder"
          name="folder"
          value={values.folder}
          onChange={setters.setFolder}
        />
      </FormGroup>
    </Form>
  );
};
