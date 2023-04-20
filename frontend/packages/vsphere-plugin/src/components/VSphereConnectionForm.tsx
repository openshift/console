import * as React from 'react';
import { Form, FormGroup, TextInput } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { useK8sModel } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { PopoverHelpButton } from '../PopoverHelpButton';
import { useConnectionFormContext } from './ConnectionFormContext';
import { initialLoad } from './initialLoad';
import { VSphereConnectionProps } from './types';

import './VSphereConnectionForm.css';

export const VSphereConnectionForm: React.FC<VSphereConnectionProps> = ({
  cloudProviderConfig,
}) => {
  const { t } = useTranslation();
  const formId = 'vsphere-connection-modal-form';

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [secretModel] = useK8sModel({ group: 'app', version: 'v1', kind: 'Secret' });
  const vcenterRef = React.useRef<HTMLInputElement>(null);

  const {
    vcenter,
    username,
    password,
    datacenter,
    defaultDatastore,
    folder,

    setDirty,
    setVcenter,
    setUsername,
    setPassword,
    setDatacenter,
    setDefaultDatastore,
    setFolder,
  } = useConnectionFormContext();

  React.useEffect(() => {
    vcenterRef?.current?.focus();
  }, []);

  // initial load
  React.useEffect(() => {
    const doItAsync = async () => {
      if (isLoaded) {
        return;
      }
      if (!cloudProviderConfig) {
        return;
      }

      setIsLoaded(true);
      await initialLoad(
        {
          setDirty,
          setVcenter,
          setUsername,
          setPassword,
          setDatacenter,
          setDefaultDatastore,
          setFolder,
        },
        secretModel,
        cloudProviderConfig,
      );
    };

    doItAsync();
  }, [
    secretModel,
    cloudProviderConfig,
    isLoaded,
    setDatacenter,
    setDefaultDatastore,
    setDirty,
    setFolder,
    setPassword,
    setUsername,
    setVcenter,
  ]);

  const folderHelperText = (
    <Trans i18nKey="vsphere-plugin~vsphere-connection-form-folderhelp-one">
      Provide <b>datacenter</b> folder which contains VMs of the cluster, example: /
      <span className="plugin-vsphere-form-helper__datacenter">{{ datacenter }}</span>/<b>vm</b>/
      <b>[MY_VMS_TOP_FOLDER]</b>.
    </Trans>
  );

  const datacenterHelperText = (
    <>
      <Trans i18nKey="vsphere-plugin~vsphere-connection-form-datacenterhelp-one">
        Enter the name of the vSphere data center that contains the virtual machines currently
        backing-up the cluster.
      </Trans>
      <br />
      <strong>
        <Trans i18nKey="vsphere-plugin~vsphere-connection-form-datacenterhelp-two">
          Warning: Updating this value once the configuration has been saved will detach any
          existing PersistentVolumes.
        </Trans>
      </strong>
    </>
  );

  const datastoreHelperText = (
    <>
      <Trans i18nKey="vsphere-plugin~vsphere-connection-form-datastorehelp-one">
        Select the data store in the vSphere data center that is to store the persistent data
        volumes.
      </Trans>
      <br />
      <strong>
        <Trans i18nKey="vsphere-plugin~vsphere-connection-form-datastorehelp-two">
          Warning: Updating this value will break any existing PersistentVolumes.
        </Trans>
      </strong>
      .
    </>
  );

  return (
    <Form id={formId}>
      <FormGroup
        label={t('vsphere-plugin~vCenter')}
        labelIcon={
          <PopoverHelpButton
            content={
              <>
                {t(
                  'vsphere-plugin~Enter the network address of the vCenter server. It can either be a domain name or IP address. It appears in the vSphere web client URL. Example:  ',
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
        helperText={t(
          'vsphere-plugin~Can be either domain name or IP address. See tooltip for details.',
        )}
      >
        <TextInput
          isRequired
          type="text"
          id="connection-vcenter"
          name="vcenter"
          aria-describedby="connection-vcenter-helper"
          value={vcenter}
          onChange={setVcenter}
          ref={vcenterRef}
        />
      </FormGroup>
      <FormGroup
        label={t('vsphere-plugin~Username')}
        isRequired
        fieldId="connection-username"
        labelIcon={
          <PopoverHelpButton
            content={t(
              'vsphere-plugin~Enter the vSphere vCenter username. An incorrect username will render the cluster nodes unschedulable (known issue: OCPBUGS-2353).',
            )}
          />
        }
      >
        <TextInput
          isRequired
          type="text"
          id="connection-username"
          name="username"
          value={username}
          onChange={setUsername}
        />
      </FormGroup>
      <FormGroup
        label={t('vsphere-plugin~Password')}
        labelIcon={
          <PopoverHelpButton
            content={t(
              'vsphere-plugin~Enter the vSphere vCenter password. The password will be stored in a Secret in the kube-system namespace for this cluster. An incorrect password will render the cluster nodes unschedulable (known issue: OCPBUGS-2353).',
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
          value={password}
          onChange={setPassword}
        />
      </FormGroup>
      <FormGroup
        label={t('vsphere-plugin~Datacenter')}
        labelIcon={<PopoverHelpButton content={datacenterHelperText} />}
        isRequired
        fieldId="connection-datacenter"
      >
        <TextInput
          isRequired
          type="text"
          id="connection-datacenter"
          name="datacenter"
          value={datacenter}
          onChange={setDatacenter}
        />
      </FormGroup>
      <FormGroup
        label={t('vsphere-plugin~Default data store')}
        labelIcon={<PopoverHelpButton content={datastoreHelperText} />}
        isRequired
        fieldId="connection-defaultdatastore"
      >
        <TextInput
          isRequired
          type="text"
          id="connection-defaultdatastore"
          name="defaultdatastore"
          value={defaultDatastore}
          onChange={setDefaultDatastore}
        />
      </FormGroup>
      <FormGroup
        label={t('vsphere-plugin~Virtual Machine Folder')}
        labelIcon={<PopoverHelpButton content={folderHelperText} />}
        isRequired
        fieldId="connection-folder"
      >
        <TextInput
          isRequired
          type="text"
          id="connection-folder"
          name="folder"
          value={folder}
          onChange={setFolder}
        />
      </FormGroup>
    </Form>
  );
};
