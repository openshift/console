import * as React from 'react';
import { Form, FormGroup } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import { PopoverHelpButton } from '../PopoverHelpButton';
import TextField from './TextField';
import { ConnectionFormFormikValues } from './types';

import './VSphereConnectionForm.css';

export const VSphereConnectionForm = () => {
  const { t } = useTranslation('vsphere-plugin');
  const vcenterRef = React.useRef<HTMLInputElement>(null);
  const { setFieldTouched } = useFormikContext<ConnectionFormFormikValues>();

  React.useEffect(() => {
    vcenterRef?.current?.focus();
  }, []);

  return (
    <Form id="vsphere-connection-modal-form">
      <FormGroup
        label={t('vCenter')}
        labelHelp={
          <PopoverHelpButton
            content={t(
              'Enter the network address of the vCenter server. It can either be a domain name or IP address',
            )}
          />
        }
        isRequired
        fieldId="connection-vcenter"
      >
        <TextField name="vcenter" ref={vcenterRef} />
      </FormGroup>
      <FormGroup
        label={t('vCenter cluster')}
        isRequired
        fieldId="connection-vcenter-cluster"
        labelHelp={
          <PopoverHelpButton
            content={t(
              'Enter the name of the vSphere vCenter cluster where OpenShift Container Platform is installed.',
            )}
          />
        }
      >
        <TextField name="vCenterCluster" />
      </FormGroup>
      <FormGroup
        label={t('Username')}
        isRequired
        fieldId="connection-username"
        labelHelp={
          <PopoverHelpButton
            content={t(
              'Enter the vSphere vCenter username. An incorrect username will render the cluster nodes unschedulable (known issue: OCPBUGS-2353).',
            )}
          />
        }
      >
        <TextField name="username" />
      </FormGroup>
      <FormGroup
        label={t('Password')}
        labelHelp={
          <PopoverHelpButton
            content={t(
              'Enter the vSphere vCenter password. The password will be stored in a Secret in the kube-system namespace for this cluster. An incorrect password will render the cluster nodes unschedulable (known issue: OCPBUGS-2353).',
            )}
          />
        }
        isRequired
        fieldId="connection-password"
      >
        <TextField name="password" type="password" />
      </FormGroup>
      <FormGroup
        label={t('Datacenter')}
        labelHelp={
          <PopoverHelpButton
            content={
              <>
                <Trans t={t}>
                  Enter the name of the vSphere data center that contains the virtual machines
                  currently backing-up the cluster.
                </Trans>
                <br />
                <strong>
                  <Trans t={t}>
                    Warning: Updating this value once the configuration has been saved will detach
                    any existing PersistentVolumes.
                  </Trans>
                </strong>
              </>
            }
          />
        }
        isRequired
        fieldId="connection-datacenter"
        onChange={() => {
          setFieldTouched('defaultDatastore');
          setFieldTouched('folder');
        }}
      >
        <TextField name="datacenter" />
      </FormGroup>
      <FormGroup
        label={t('Default data store')}
        labelHelp={
          <PopoverHelpButton
            content={
              <>
                <Trans t={t}>
                  Select the data store in the vSphere data center that is to store the persistent
                  data volumes.
                </Trans>
                <br />
                <strong>
                  <Trans t={t}>
                    Warning: Updating this value will break any existing PersistentVolumes.
                  </Trans>
                </strong>
              </>
            }
          />
        }
        isRequired
        fieldId="connection-defaultdatastore"
      >
        <TextField name="defaultDatastore" />
      </FormGroup>
      <FormGroup
        label={t('Virtual Machine Folder')}
        labelHelp={
          <PopoverHelpButton
            content={
              <Trans t={t}>
                Provide <b>datacenter</b> folder which contains VMs of the cluster.
              </Trans>
            }
          />
        }
        isRequired
        fieldId="connection-folder"
      >
        <TextField name="folder" />
      </FormGroup>
    </Form>
  );
};
