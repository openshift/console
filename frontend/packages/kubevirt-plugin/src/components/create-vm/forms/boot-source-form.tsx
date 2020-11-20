import * as React from 'react';
import { PersistentVolumeClaimKind, StorageClassResourceKind } from '@console/internal/module/k8s';
import {
  FileUpload,
  Form,
  SelectOption,
  TextInput,
  Checkbox,
  ExpandableSection,
  FormSelect,
  FormSelectOption,
  Popover,
  PopoverPosition,
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { PersistentVolumeClaimModel, StorageClassModel } from '@console/internal/models';
import { ListDropdown, LoadingInline, RequestSizeInput } from '@console/internal/components/utils';
import {
  dropdownUnits,
  getAccessModeForProvisioner,
  provisionerAccessModeMapping,
} from '@console/internal/components/storage/shared';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';

import { FormRow } from '../../form/form-row';
import { ProjectDropdown } from '../../form/project-dropdown';
import { EXAMPLE_CONTAINER, FEDORA_IMAGE_LINK, RHEL_IMAGE_LINK } from '../../../utils/strings';
import { getDefaultStorageClass } from '../../../selectors/config-map/sc-defaults';
import { BootSourceAction, BootSourceState, BOOT_ACTION_TYPE } from './boot-source-form-reducer';
import { AccessMode, DataVolumeSourceType } from '../../../constants';
import { FormPFSelect } from '../../form/form-pf-select';
import { preventDefault } from '../../form/utils';

type BootSourceFormProps = {
  state: BootSourceState;
  dispatch: React.Dispatch<BootSourceAction>;
  withUpload?: boolean;
};

export const BootSourceForm: React.FC<BootSourceFormProps> = ({ state, dispatch, withUpload }) => {
  const [storageClasses, scLoaded] = useK8sWatchResource<StorageClassResourceKind[]>({
    kind: StorageClassModel.kind,
    isList: true,
    namespaced: false,
  });

  const useProjects = useFlag(FLAGS.OPENSHIFT);

  const defaultSCName = getDefaultStorageClass(storageClasses)?.metadata.name;

  const handleStorageClass = React.useCallback(
    (scName: string) => {
      const updatedStorageClass = storageClasses.find((sc) => sc.metadata.name === scName);
      const provisioner = updatedStorageClass?.provisioner || '';
      const modes: string[] =
        provisionerAccessModeMapping[provisioner] || getAccessModeForProvisioner(provisioner);
      dispatch({
        type: BOOT_ACTION_TYPE.SET_ACCESS_MODE,
        payload: AccessMode.READ_WRITE_ONCE.getValue(),
      });
      dispatch({
        type: BOOT_ACTION_TYPE.SET_ACCESS_MODES,
        payload: modes,
      });
      dispatch({
        type: BOOT_ACTION_TYPE.SET_STORAGE_CLASS,
        payload: updatedStorageClass?.metadata?.name,
      });
    },
    [dispatch, storageClasses],
  );

  React.useEffect(() => {
    if (scLoaded && !state.storageClass?.value && defaultSCName) {
      handleStorageClass(defaultSCName);
    }
  }, [defaultSCName, handleStorageClass, scLoaded, state.storageClass]);

  const isUpstream = window.SERVER_FLAGS.branding === 'okd';
  return (
    <Form onSubmit={preventDefault}>
      <FormRow fieldId="form-data-source" title="Data source type" isRequired>
        <FormPFSelect
          placeholderText="--- Select data source ---"
          aria-label="Select data source"
          onSelect={(e, value: DataVolumeSourceType) =>
            dispatch({
              type: BOOT_ACTION_TYPE.SET_DATA_SOURCE,
              payload: value.getValue(),
            })
          }
          selections={DataVolumeSourceType.fromString(state.dataSource?.value)}
        >
          {DataVolumeSourceType.getBootSourceTypes()
            .filter((ds) => (withUpload ? true : ds !== DataVolumeSourceType.UPLOAD))
            .map((ds) => (
              <SelectOption key={ds.getValue()} value={ds} description={ds.getDescription()} />
            ))}
        </FormPFSelect>
      </FormRow>
      {state.dataSource?.value === DataVolumeSourceType.UPLOAD.getValue() && (
        <FormRow fieldId="form-ds-file" title="Upload source" isRequired>
          <FileUpload
            id="file-upload"
            value={state.file?.value.value}
            filename={state.file?.value.name}
            onChange={(file: File, name: string) =>
              dispatch({
                type: BOOT_ACTION_TYPE.SET_FILE,
                payload: { value: file, name },
              })
            }
            hideDefaultPreview
            isRequired
          />
        </FormRow>
      )}
      {state.dataSource?.value === DataVolumeSourceType.HTTP.getValue() && (
        <FormRow
          fieldId="form-ds-url"
          title="Import URL"
          isRequired
          validation={state.url?.validation}
        >
          <TextInput
            value={state.url?.value}
            type="text"
            onChange={(payload) => dispatch({ type: BOOT_ACTION_TYPE.SET_URL, payload })}
            aria-label="import URL"
          />
          <div className="pf-c-form__helper-text" aria-live="polite">
            Example: Visit the{' '}
            <a
              href={isUpstream ? FEDORA_IMAGE_LINK : RHEL_IMAGE_LINK}
              rel="noopener noreferrer"
              target="_blank"
            >
              <strong>{isUpstream ? 'Fedora' : 'RHEL'} cloud image list</strong>
            </a>{' '}
            and copy a url for the field above
          </div>
        </FormRow>
      )}
      {state.dataSource?.value === DataVolumeSourceType.REGISTRY.getValue() && (
        <FormRow
          fieldId="form-ds-container"
          title="Container registry"
          isRequired
          validation={state.container?.validation}
        >
          <TextInput
            value={state.container?.value}
            type="text"
            onChange={(payload) => dispatch({ type: BOOT_ACTION_TYPE.SET_CONTAINER, payload })}
            aria-label="Container registry"
          />
          <div className="pf-c-form__helper-text" aria-live="polite">
            Example: {EXAMPLE_CONTAINER}
          </div>
        </FormRow>
      )}
      {state.dataSource?.value === DataVolumeSourceType.PVC.getValue() && (
        <>
          <FormRow
            fieldId="form-ds-pvc-ns"
            title={`${PersistentVolumeClaimModel.label} ${useProjects ? 'project' : 'namespace'}`}
            isRequired
          >
            <ProjectDropdown
              onChange={(payload) => {
                dispatch({ type: BOOT_ACTION_TYPE.SET_PVC_NAMESPACE, payload });
                dispatch({ type: BOOT_ACTION_TYPE.SET_PVC_NAME, payload: undefined });
              }}
              project={state.pvcNamespace?.value}
              placeholder={PersistentVolumeClaimModel.label}
            />
          </FormRow>
          {state.pvcNamespace?.value && (
            <FormRow
              fieldId="form-ds-pvc"
              title={`${PersistentVolumeClaimModel.label} name`}
              isRequired
            >
              <ListDropdown
                resources={[
                  {
                    kind: PersistentVolumeClaimModel.kind,
                    namespace: state.pvcNamespace.value,
                  },
                ]}
                onChange={(val, kind, pvc: PersistentVolumeClaimKind) => {
                  dispatch({ type: BOOT_ACTION_TYPE.SET_PVC_NAME, payload: pvc.metadata.name });
                  dispatch({
                    type: BOOT_ACTION_TYPE.SET_PVC_SIZE,
                    payload: pvc.spec.resources.requests.storage,
                  });
                }}
                placeholder={`--- Select ${PersistentVolumeClaimModel.label} ---`}
                desc={PersistentVolumeClaimModel.label}
              />
            </FormRow>
          )}
        </>
      )}
      <FormRow fieldId="form-ds-cdrom">
        <Checkbox
          isChecked={state.cdRom?.value}
          onChange={(payload) => dispatch({ type: BOOT_ACTION_TYPE.SET_CD_ROM, payload })}
          label={
            <>
              Mount this source as CD-ROM
              <Popover
                position={PopoverPosition.top}
                aria-label="cdrom help"
                bodyContent="CD-ROM requires an additional disk for the operating system to be installed onto. This disk will be added and can be customized when creating the virtual machine."
              >
                <button
                  type="button"
                  onClick={preventDefault}
                  className="pf-c-form__group-label-help"
                  aria-label="cdrom help"
                >
                  <HelpIcon noVerticalAlign />
                </button>
              </Popover>
            </>
          }
          id="cdrom"
        />
      </FormRow>
      {[
        DataVolumeSourceType.PVC,
        DataVolumeSourceType.HTTP,
        DataVolumeSourceType.REGISTRY,
      ].includes(DataVolumeSourceType.fromString(state.dataSource?.value)) && (
        <FormRow
          fieldId="form-ds-pvc-size"
          title={`${PersistentVolumeClaimModel.label} size`}
          isRequired
          validation={state.size?.validation}
        >
          <RequestSizeInput
            name="requestSize"
            required
            onChange={(payload) => dispatch({ type: BOOT_ACTION_TYPE.SET_SIZE, payload })}
            defaultRequestSizeUnit={state.size?.value.unit}
            defaultRequestSizeValue={`${state.size?.value.value}`}
            dropdownUnits={dropdownUnits}
            describedBy="request-size-help"
            inputID="request-size-input"
          >
            <div className="pf-c-form__helper-text" aria-live="polite">
              Ensure your PVC size covers the requirements of the uncompressed image and any other
              space requirements. More storage can be added later.
            </div>
          </RequestSizeInput>
        </FormRow>
      )}
      <ExpandableSection toggleText="Advanced">
        <FormRow fieldId="form-ds-sc" title="Storage class" isRequired>
          <FormSelect
            value={
              defaultSCName === state.storageClass?.value
                ? `${state.storageClass?.value} (default)`
                : state.storageClass?.value
            }
            onChange={handleStorageClass}
            id="vm-select-sc"
            name="vm-select-sc"
            aria-label="Select storage class"
            isDisabled={!scLoaded}
          >
            {storageClasses.map((sc) => (
              <FormSelectOption
                key={sc.metadata.uid}
                value={sc.metadata.name}
                label={
                  defaultSCName === sc.metadata.name
                    ? `${sc.metadata.name} (default)`
                    : sc.metadata.name
                }
              />
            ))}
          </FormSelect>
          {!scLoaded && <LoadingInline />}
        </FormRow>
        <FormRow fieldId="form-ds-access-mode" title="Access mode" isRequired>
          <FormPFSelect
            aria-label="Select access mode"
            onSelect={(e, value: AccessMode) =>
              dispatch({
                type: BOOT_ACTION_TYPE.SET_ACCESS_MODE,
                payload: value.getValue(),
              })
            }
            selections={AccessMode.fromString(state.accessMode?.value)}
          >
            {state.accessModes?.value?.map((am) => {
              const accessMode = AccessMode.fromString(am);
              return <SelectOption key={accessMode.getValue()} value={accessMode} />;
            })}
          </FormPFSelect>
          {!scLoaded && <LoadingInline />}
        </FormRow>
      </ExpandableSection>
    </Form>
  );
};
