import * as _ from 'lodash-es';
import * as React from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';

import { useTranslation } from 'react-i18next';
import { ActionGroup, Button } from '@patternfly/react-core';
import { isObjectSC } from '@console/shared/src/utils';
import { AccessModeSelector } from '@console/app/src/components/access-modes/access-mode';
import { VolumeModeSelector } from '@console/app/src/components/volume-modes/volume-mode';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { LinkTo } from '@console/shared/src/components/links/LinkTo';
import { k8sCreate, K8sResourceKind, referenceFor } from '../../module/k8s';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { AsyncComponent, ButtonBar, RequestSizeInput, resourceObjPath } from '../utils';
import { StorageClassDropdown } from '../utils/storage-class-dropdown';
import { Checkbox } from '../checkbox';
import { PersistentVolumeClaimModel } from '../../models';
import { StorageClass } from '../storage-class-form';
import { getProvisionerModeMapping, initialAccessModes, dropdownUnits } from './shared';

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
        obj.spec.volumeMode = volumeMode;
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

  const { t } = useTranslation();

  const handleNameValuePairs = ({ nameValuePairs: updatedNameValuePairs }) => {
    setNameValuePairs(updatedNameValuePairs);
  };

  const handleStorageClass = (updatedStorageClass) => {
    const provisioner: string = updatedStorageClass?.provisioner || '';
    //setting message to display for various modes when a storage class of a know provisioner is selected
    const displayMessage = getProvisionerModeMapping(provisioner)
      ? `${t('public~Access mode is set by StorageClass and cannot be changed')}`
      : `${t('public~Permissions to the mounted drive')}`;
    setAccessModeHelp(displayMessage);
    //setting accessMode to default with the change to Storage Class selection
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
    setPvcName(event.currentTarget.value.trim());
  };

  const onlyPvcSCs = React.useCallback((sc: StorageClass) => !isObjectSC(sc), []);

  return (
    <div>
      <div className="form-group">
        <StorageClassDropdown
          onChange={handleStorageClass}
          id="storageclass-dropdown"
          data-test="storageclass-dropdown"
          describedBy="storageclass-dropdown-help"
          required={false}
          name="storageClass"
          filter={onlyPvcSCs}
        />
      </div>
      <label className="co-required" htmlFor="pvc-name">
        {t('public~PersistentVolumeClaim name')}
      </label>
      <div className="form-group">
        <span className="pf-v6-c-form-control">
          <input
            type="text"
            onChange={handlePvcName}
            placeholder="my-storage-claim"
            aria-describedby="pvc-name-help"
            id="pvc-name"
            data-test="pvc-name"
            name="pvcName"
            value={pvcName}
            required
          />
        </span>
        <p className="help-block" id="pvc-name-help">
          {t('public~A unique name for the storage claim within the project')}
        </p>
      </div>
      <div className="form-group pf-v6-c-form">
        <AccessModeSelector
          onChange={setAccessMode}
          provisioner={storageProvisioner}
          loaded
          availableAccessModes={initialAccessModes}
          description={accessModeHelp}
          ignoreReadOnly
        />
      </div>
      <label className="co-required" htmlFor="request-size-input">
        {t('public~Size')}
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
        testID="pvc-size"
      />
      <p className="help-block" id="request-size-help">
        {t('public~Desired storage capacity')}
      </p>
      <Checkbox
        label={t('public~Use label selectors to request storage')}
        onChange={handleUseSelector}
        checked={useSelector}
        name="showLabelSelector"
      />
      <div className="form-group">
        {useSelector && (
          <NameValueEditorComponent
            nameValuePairs={nameValuePairs}
            valueString={t('public~Selector')}
            nameString={t('public~Label')}
            addString={t('public~Add value')}
            readOnly={false}
            allowSorting={false}
            updateParentData={handleNameValuePairs}
          />
        )}
        <p className="help-block" id="label-selector-help">
          {t(
            'public~PersistentVolume resources that match all label selectors will be considered for binding.',
          )}
        </p>
      </div>
      <div className="form-group pf-v6-c-form">
        <VolumeModeSelector
          onChange={setVolumeMode}
          provisioner={storageProvisioner}
          accessMode={accessMode}
          storageClass={storageClass}
          loaded
        />
      </div>
    </div>
  );
};

export const CreatePVCPage: React.FC<CreatePVCPageProps> = (props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = React.useState('');
  const [inProgress, setInProgress] = React.useState(false);
  const [pvcObj, setPvcObj] = React.useState(null);
  const { namespace } = props;
  const title = t('public~Create PersistentVolumeClaim');

  const save = (e: React.FormEvent<EventTarget>) => {
    e.preventDefault();
    setInProgress(true);
    k8sCreate(PersistentVolumeClaimModel, pvcObj).then(
      (resource) => {
        setInProgress(false);
        navigate(resourceObjPath(resource, referenceFor(resource)));
      },
      ({ message }: { message: string }) => {
        setError(message || 'Could not create persistent volume claim.');
        setInProgress(false);
      },
    );
  };

  return (
    <>
      <DocumentTitle>{title}</DocumentTitle>
      <PageHeading
        title={title}
        linkProps={{
          component: LinkTo(`/k8s/ns/${namespace}/persistentvolumeclaims/~new`, { replace: true }),
          id: 'yaml-link',
          'data-test': 'yaml-link',
          label: t('public~Edit YAML'),
        }}
      />
      <PaneBody>
        <div className="co-m-pane__form">
          <form onSubmit={save} className="pf-v6-c-form pf-v6-c-form--no-gap">
            <CreatePVCForm onChange={setPvcObj} namespace={namespace} />
            <ButtonBar errorMessage={error} inProgress={inProgress}>
              <ActionGroup className="pf-v6-c-form">
                <Button id="save-changes" data-test="create-pvc" type="submit" variant="primary">
                  {t('public~Create')}
                </Button>
                <Button
                  onClick={() => navigate(`/k8s/ns/${namespace}/persistentvolumeclaims/`)}
                  type="button"
                  variant="secondary"
                >
                  {t('public~Cancel')}
                </Button>
              </ActionGroup>
            </ButtonBar>
          </form>
        </div>
      </PaneBody>
    </>
  );
};

export const CreatePVC = () => {
  const params = useParams();
  const namespace = params.ns || 'default';
  return <CreatePVCPage namespace={namespace} />;
};

export type CreatePVCFormProps = {
  namespace: string;
  onChange: (K8sResourceKind) => void;
};

export type CreatePVCPageProps = {
  namespace: string;
};
