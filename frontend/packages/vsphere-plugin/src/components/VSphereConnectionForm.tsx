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
        The name of an existing datacenter in the vSphere which the virtual machines backing this
        cluster are in.
      </Trans>
      <br />
      <strong>
        <Trans i18nKey="vsphere-plugin~vsphere-connection-form-datacenterhelp-two">
          Note: Updating this value will break any existing PersistentVolumes.
        </Trans>
      </strong>
    </>
  );

  const datastoreHelperText = (
    <>
      <Trans i18nKey="vsphere-plugin~vsphere-connection-form-datastorehelp-one">
        The name of an existing datastore in the datacenter where the persistent volumes will be
        stored.
      </Trans>
      <br />
      <strong>
        <Trans i18nKey="vsphere-plugin~vsphere-connection-form-datastorehelp-two">
          Note: Updating this value will break any existing PersistentVolumes.
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
                  "vsphere-plugin~Enter the network address the vCenter is running on. It can either be a domain name or IP. If you're unsure, you can try to determine the value from the vSphere Web Client address. Example: ",
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
          'vsphere-plugin~Can be both domain name or IP, see additional info how to get it.',
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
              'vsphere-plugin~The vSphere vCenter username. Mind to double-check it is correct, otherwise cluster nodes will get unschedulable (Known issue: OCPBUGS-2353).',
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
              'vsphere-plugin~The password will be stored in a Secret in the kube-system namespace of this cluster. Mind to double-check it is correct, otherwise cluster nodes will get unschedulable (Known issue: OCPBUGS-2353).',
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
