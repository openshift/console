import * as _ from 'lodash-es';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { ActionGroup, Button } from '@patternfly/react-core';
import { isCephProvisioner, isObjectSC } from '@console/shared/src/utils';
import { k8sCreate, K8sResourceKind, referenceFor } from '../../module/k8s';
import { AsyncComponent, ButtonBar, RequestSizeInput, history, resourceObjPath } from '../utils';
import { StorageClassDropdown } from '../utils/storage-class-dropdown';
import { RadioInput } from '../radio';
import { Checkbox } from '../checkbox';
import { PersistentVolumeClaimModel } from '../../models';
import { StorageClass } from '../storage-class-form';
import {
  cephRBDProvisionerSuffix,
  provisionerAccessModeMapping,
  initialAccessModes,
  accessModeRadios,
  volumeModeRadios,
  dropdownUnits,
  getAccessModeForProvisioner,
} from './shared';

const NameValueEditorComponent = (props) => (
  <AsyncComponent
    loader={() => import('../utils/name-value-editor').then((c) => c.NameValueEditor)}
    {...props}
  />
);

// This form is done a little odd since it is used in both its own page and as
// a sub form inside the attach storage page.
export const CreatePVCForm: React.FC<CreatePVCFormProps> = (props) => {
  const [accessModeHelp, setAccessModeHelp] = React.useState('Permissions to the mounted drive.');
  const [allowedAccessModes, setAllowedAccessModes] = React.useState(initialAccessModes);
  const [storageClass, setStorageClass] = React.useState('');
  const [pvcName, setPvcName] = React.useState('');
  const [accessMode, setAccessMode] = React.useState('ReadWriteOnce');
  const [volumeMode, setVolumeMode] = React.useState('Filesystem');
  const [requestSizeValue, setRequestSizeValue] = React.useState('');
  const [requestSizeUnit, setRequestSizeUnit] = React.useState('Gi');
  const [useSelector, setUseSelector] = React.useState(false);
  const [nameValuePairs, setNameValuePairs] = React.useState([['', '']]);
  const [storageProvisioner, setStorageProvisioner] = React.useState('');
  const { namespace, onChange } = props;

  React.useEffect(() => {
    const getSelector = () => {
      if (!useSelector) {
        return null;
      }

      const matchLabels = _.reduce(
        nameValuePairs,
        (acc, [key, value]) => {
          return key ? { ...acc, [key]: value } : acc;
        },
        {},
      );

      return _.isEmpty(matchLabels) ? null : { matchLabels };
    };
    const updatePVC = (): K8sResourceKind => {
      const obj: K8sResourceKind = {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: {
          name: pvcName,
          namespace,
        },
        spec: {
          accessModes: [accessMode],
          volumeMode,
          resources: {
            requests: {
              storage: `${requestSizeValue}${requestSizeUnit}`,
            },
          },
        },
      };

      // Add the selector only if specified.
      const selector = getSelector();
      if (selector) {
        obj.spec.selector = selector;
      }

      if (storageClass) {
        obj.spec.storageClassName = storageClass;

        // should set block only for RBD + RWX
        if (
          _.endsWith(storageProvisioner, cephRBDProvisionerSuffix) &&
          accessMode === 'ReadWriteMany'
        ) {
          obj.spec.volumeMode = 'Block';
        }
      }

      return obj;
    };
    onChange(updatePVC);
  }, [
    accessMode,
    namespace,
    nameValuePairs,
    pvcName,
    onChange,
    storageClass,
    requestSizeValue,
    requestSizeUnit,
    useSelector,
    storageProvisioner,
    volumeMode,
  ]);

  const handleNameValuePairs = ({ nameValuePairs: updatedNameValuePairs }) => {
    setNameValuePairs(updatedNameValuePairs);
  };

  const handleStorageClass = (updatedStorageClass) => {
    const provisioner: string = updatedStorageClass?.provisioner || '';
    //if the provisioner is unknown or no storage class selected, user should be able to set any access mode
    const modes = provisionerAccessModeMapping[provisioner]
      ? provisionerAccessModeMapping[provisioner]
      : getAccessModeForProvisioner(provisioner);
    //setting message to display for various modes when a storage class of a know provisioner is selected
    const displayMessage =
      provisionerAccessModeMapping[provisioner] || isCephProvisioner(provisioner)
        ? 'Access mode is set by storage class and cannot be changed'
        : 'Permissions to the mounted drive';
    setAccessMode('ReadWriteOnce');
    setAccessModeHelp(displayMessage);
    //setting accessMode to default with the change to Storage Class selection
    setAllowedAccessModes(modes);
    setStorageClass(updatedStorageClass?.metadata?.name);
    setStorageProvisioner(provisioner);
  };

  const handleRequestSizeInputChange = (obj) => {
    setRequestSizeValue(obj.value);
    setRequestSizeUnit(obj.unit);
  };

  const handleUseSelector: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setUseSelector(event.currentTarget.checked);
  };

  const handlePvcName: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setPvcName(event.currentTarget.value);
  };

  const handleAccessMode: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setAccessMode(event.currentTarget.value);
  };

  const handleVolumeMode: React.ReactEventHandler<HTMLInputElement> = (event) => {
    setVolumeMode(event.currentTarget.value);
  };

  const onlyPvcSCs = React.useCallback((sc: StorageClass) => !isObjectSC(sc), []);

  return (
    <div>
      <div className="form-group">
        <StorageClassDropdown
          onChange={handleStorageClass}
          id="storageclass-dropdown"
          describedBy="storageclass-dropdown-help"
          required={false}
          name="storageClass"
          filter={onlyPvcSCs}
        />
      </div>
      <label className="control-label co-required" htmlFor="pvc-name">
        Persistent Volume Claim Name
      </label>
      <div className="form-group">
        <input
          className="pf-c-form-control"
          type="text"
          onChange={handlePvcName}
          placeholder="my-storage-claim"
          aria-describedby="pvc-name-help"
          id="pvc-name"
          name="pvcName"
          required
        />
        <p className="help-block" id="pvc-name-help">
          A unique name for the storage claim within the project
        </p>
      </div>
      <label className="control-label co-required" htmlFor="access-mode">
        Access Mode
      </label>
      <div className="form-group">
        {accessModeRadios.map((radio) => {
          let radioObj = null;
          const disabled = !allowedAccessModes.includes(radio.value);

          allowedAccessModes.forEach((mode) => {
            const checked = !disabled ? radio.value === accessMode : radio.value === mode;
            radioObj = (
              <RadioInput
                {...radio}
                key={radio.value}
                onChange={handleAccessMode}
                inline={true}
                disabled={disabled}
                checked={checked}
                aria-describedby="access-mode-help"
                name="accessMode"
              />
            );
          });

          return radioObj;
        })}
        <p className="help-block" id="access-mode-help">
          {accessModeHelp}
        </p>
      </div>
      <label className="control-label co-required" htmlFor="request-size-input">
        Size
      </label>
      <RequestSizeInput
        name="requestSize"
        required
        onChange={handleRequestSizeInputChange}
        defaultRequestSizeUnit={requestSizeUnit}
        defaultRequestSizeValue={requestSizeValue}
        dropdownUnits={dropdownUnits}
        describedBy="request-size-help"
        inputID="request-size-input"
      />
      <p className="help-block" id="request-size-help">
        Desired storage capacity
      </p>
      <Checkbox
        label="Use label selectors to request storage"
        onChange={handleUseSelector}
        checked={useSelector}
        name="showLabelSelector"
      />
      <div className="form-group">
        {useSelector && (
          <NameValueEditorComponent
            nameValuePairs={nameValuePairs}
            valueString="Selector"
            nameString="Label"
            addString="Add Value"
            readOnly={false}
            allowSorting={false}
            updateParentData={handleNameValuePairs}
          />
        )}
        <p className="help-block" id="label-selector-help">
          Use label selectors to define how storage is created
        </p>
      </div>
      <label className="control-label" htmlFor="volume-mode">
        Volume Mode
      </label>
      <div className="form-group">
        {volumeModeRadios.map((radio) => (
          <RadioInput
            {...radio}
            key={radio.value}
            onChange={handleVolumeMode}
            inline
            checked={radio.value === volumeMode}
            name="volumeMode"
          />
        ))}
      </div>
    </div>
  );
};

export const CreatePVCPage: React.FC<CreatePVCPageProps> = (props) => {
  const [error, setError] = React.useState('');
  const [inProgress, setInProgress] = React.useState(false);
  const [pvcObj, setPvcObj] = React.useState(null);
  const title = 'Create Persistent Volume Claim';
  const { namespace } = props;

  const save = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    setInProgress(true);
    k8sCreate(PersistentVolumeClaimModel, pvcObj).then(
      (resource) => {
        setInProgress(false);
        history.push(resourceObjPath(resource, referenceFor(resource)));
      },
      ({ message }: { message: string }) => {
        setError(message || 'Could not create persistent volume claim.');
        setInProgress(false);
      },
    );
  };

  return (
    <div className="co-m-pane__body co-m-pane__form">
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <h1 className="co-m-pane__heading co-m-pane__heading--baseline">
        <div className="co-m-pane__name">{title}</div>
        <div className="co-m-pane__heading-link">
          <Link
            to={`/k8s/ns/${namespace}/persistentvolumeclaims/~new`}
            id="yaml-link"
            data-test="yaml-link"
            replace
          >
            Edit YAML
          </Link>
        </div>
      </h1>
      <form className="co-m-pane__body-group" onSubmit={save}>
        <CreatePVCForm onChange={setPvcObj} namespace={namespace} />
        <ButtonBar errorMessage={error} inProgress={inProgress}>
          <ActionGroup className="pf-c-form">
            <Button id="save-changes" type="submit" variant="primary">
              Create
            </Button>
            <Button onClick={history.goBack} type="button" variant="secondary">
              Cancel
            </Button>
          </ActionGroup>
        </ButtonBar>
      </form>
    </div>
  );
};

export const CreatePVC = ({ match: { params } }) => {
  return <CreatePVCPage namespace={params.ns} />;
};

export type CreatePVCFormProps = {
  namespace: string;
  onChange: (K8sResourceKind) => void;
};

export type CreatePVCPageProps = {
  namespace: string;
};
