import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Form,
  FormGroup,
  TextContent,
  TextInput,
  TextVariants,
  Text,
} from '@patternfly/react-core';
import { getExternalStorage } from '../../../../utils/create-storage-system';
import { WizardDispatch, WizardState } from '../../reducer';
import { ExternalStateValues, ExternalStateKeys } from '../../external-storage/types';
import './create-storage-class-step.scss';

export const CreateStorageClass: React.FC<CreateStorageClassProps> = ({
  state,
  storageClass,
  externalStorage,
  dispatch,
}) => {
  const { t } = useTranslation();

  const { Component, displayName } = getExternalStorage(externalStorage) || {};

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
    <Form className="odf-create-storage-class__form">
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
      <TextContent>
        <Text component={TextVariants.h4}>
          {t('ceph-storage-plugin~{{displayName}} connection details', { displayName })}
        </Text>
      </TextContent>
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
