import * as React from 'react';
import * as _ from 'lodash';
import { MinusCircleIcon } from '@patternfly/react-icons';
import { getName } from '@console/shared';
import {
  FormSelect,
  FormGroup,
  Text,
  TextVariants,
  FormSelectOption,
  TextInput,
  Button,
} from '@patternfly/react-core';
import { PersistentVolumeClaimModel, StorageClassModel } from '@console/internal/models';
import { FirehoseResult } from '@console/internal/components/utils';
import { K8sResourceSelectRow } from '../../form/k8s-resource-select-row';
import { VMKind } from '../../../types';
import { FormSelectPlaceholderOption } from '../../form/form-select-placeholder-option';
import { StorageType, CD_SIZE, CD_STORAGE_CLASS } from './constants';
import { CD } from './types';

export const CDRomRow: React.FC<CDRomRowProps> = ({
  cd,
  pvcs,
  usedPVCs,
  storageClasses,
  index,
  onChange,
  onDelete,
  isWindows,
  inProgress,
  winToolsContainer,
}) => {
  const { name, type, container, pvc, url, windowsTools, size, storageClass, isURLValid } = cd;

  return (
    <>
      <div className="kubevirt-cdrom-modal__rowheader">
        <div className="kubevirt-cdrom-modal__delete">
          <Text component={TextVariants.h3}>{`CD Drive ${index + 1}`}</Text>
          <Button className="pf-m-link--align-right" onClick={() => onDelete(name)} variant="plain">
            <MinusCircleIcon />
          </Button>
        </div>
        <FormGroup hasNoPaddingTop label="Source" fieldId="cd-rom-modal-type">
          <FormSelect
            value={type}
            onChange={(v) => onChange(name, 'type', v)}
            id={`cd-rom-modal-select-type-${name}`}
          >
            <FormSelectOption key="container-option" value="container" label="Container" />
            <FormSelectOption key="pvc-option" value="pvc" label="Attach Disk" />
            <FormSelectOption key="url-option" value="url" label="URL" />
            {isWindows && (
              <FormSelectOption
                key="wintools-option"
                value="windowsTools"
                label="Windows guest tools"
              />
            )}
          </FormSelect>
        </FormGroup>
      </div>
      {type === StorageType.URL && (
        <>
          <FormGroup
            label="URL"
            fieldId="cd-rom-modal-url"
            id={`cd-url-text-input-${name}`}
            validated={isURLValid ? 'default' : 'error'}
            helperTextInvalid="Invalid URL"
          >
            <TextInput
              isRequired
              type="text"
              value={url}
              onChange={(v) => onChange(name, StorageType.URL, v)}
              aria-label="url path"
            />
          </FormGroup>
          <FormGroup
            id={`cd-url-size-input-${name}`}
            label="Size (GiB)"
            className="pf-m-2-col-on-md"
            fieldId="cd-rom-modal-cdsize"
          >
            <TextInput
              isRequired
              type="text"
              value={size}
              onChange={(v) => onChange(name, CD_SIZE, v)}
              aria-label="cd size"
            />
          </FormGroup>
          <K8sResourceSelectRow
            key="storage-class"
            id={`cd-url-storageclass-input-${name}`}
            isDisabled={inProgress}
            name={storageClass}
            data={storageClasses}
            model={StorageClassModel}
            hasPlaceholder
            onChange={(sc) => onChange(name, CD_STORAGE_CLASS, sc)}
          />
        </>
      )}
      {type === StorageType.CONTAINER && (
        <FormGroup
          className="pf-m-8-col-on-md"
          label="Container"
          fieldId="cd-rom-modal-container"
          id={`cdrom-container-input-${name}`}
        >
          <TextInput
            isRequired
            type="text"
            value={container}
            onChange={(v) => onChange(name, StorageType.CONTAINER, v)}
            aria-label="container path"
          />
        </FormGroup>
      )}
      {type === StorageType.PVC && (
        <div className="pf-m-8-col-on-md">
          <K8sResourceSelectRow
            key="pvc-select"
            title="Attach Disk"
            id={`cdrom-pvc-input-${name}`}
            isDisabled={inProgress}
            name={pvc}
            data={pvcs}
            model={PersistentVolumeClaimModel}
            hasPlaceholder
            isPlaceholderDisabled
            onChange={(p) => onChange(name, StorageType.PVC, p)}
            filter={(p) => !_.includes(_.without(usedPVCs, pvc), getName(p))}
          />
        </div>
      )}
      {type === StorageType.WINTOOLS && (
        <FormGroup
          label="Windows guest tools"
          id={`cdrom-wintools-input-${name}`}
          className="pf-m-8-col-on-md"
          fieldId="cd-rom-modal-wintools"
        >
          <FormSelect
            aria-label="cd-rom-wintools-label"
            value={windowsTools}
            onChange={(v) => onChange(name, StorageType.WINTOOLS, v)}
          >
            <FormSelectPlaceholderOption placeholder="--- Select Windows Tools Container ---" />
            <FormSelectOption
              key={winToolsContainer}
              value={winToolsContainer}
              label={winToolsContainer}
            />
          </FormSelect>
        </FormGroup>
      )}
    </>
  );
};

export type CDRomRowProps = {
  cd: CD;
  pvcs: FirehoseResult<VMKind[]>;
  storageClasses: FirehoseResult<VMKind[]>;
  winToolsContainer: string;
  usedPVCs: string[];
  index: number;
  onChange: (cdName: string, key: string, value: string) => void;
  onDelete: (cdName: any) => void;
  isWindows: boolean;
  inProgress: boolean;
};
