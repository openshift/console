import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, FormGroup, TextInput } from '@patternfly/react-core';
import { getExternalStorage } from '../../../utils/create-storage-system';
import { WizardDispatch, WizardState } from '../reducer';
import { ExternalStateValues, ExternalStateKeys } from '../external-storage/types';

export const CreateStorageClass: React.FC<CreateStorageClassProps> = ({
  state,
  storageClass,
  externalStorage,
  dispatch,
}) => {
  const { t } = useTranslation();

  const { Component } = getExternalStorage(externalStorage) || {};

  const setForm = React.useCallback(
    (field: ExternalStateKeys, value: ExternalStateValues) =>
      dispatch({
        type: 'wizard/setCreateStorageClass',
        payload: {
          field,
          value,
        },
      }),
    [dispatch],
  );

  return (
    <Form>
      <FormGroup label={t('ceph-storage-plugin~StorageClass name')} fieldId="storage-class-name">
        <TextInput
          id="storage-class-name"
          value={storageClass.name}
          type="text"
          onChange={(value: string) =>
            dispatch({
              type: 'wizard/setStorageClass',
              payload: {
                name: value,
              },
            })
          }
        />
      </FormGroup>
      {Component && <Component setFormState={setForm} formState={state} />}
    </Form>
  );
};

type CreateStorageClassProps = {
  state: WizardState['createStorageClass'];
  externalStorage: WizardState['backingStorage']['externalStorage'];
  storageClass: WizardState['storageClass'];
  dispatch: WizardDispatch;
};
