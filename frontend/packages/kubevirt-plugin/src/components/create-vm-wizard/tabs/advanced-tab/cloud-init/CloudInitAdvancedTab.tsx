import * as React from 'react';
import { Alert, AlertVariant, Checkbox, Form } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch, useSelector } from 'react-redux';
import { CloudInitDataHelper } from '../../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { prefixedID } from '../../../../../utils';
import { iGetIn, ihasIn, toShallowJS } from '../../../../../utils/immutable';
import { Errors } from '../../../../errors/errors';
import { FormRow } from '../../../../form/form-row';
import { InlineBooleanRadio } from '../../../../inline-boolean-radio';
import { iGetCloudInitValue } from '../../../selectors/immutable/cloud-init';
import { iGetCommonData } from '../../../selectors/immutable/selectors';
import { iGetCloudInitNoCloudStorage } from '../../../selectors/immutable/storage';
import {
  hasStepCreateDisabled,
  hasStepDeleteDisabled,
  hasStepUpdateDisabled,
} from '../../../selectors/immutable/wizard-selectors';
import { CloudInitField, VMWizardProps, VMWizardTab } from '../../../types';
import CloudInitCustomScript from './CloudInitCustomScript';
import CloudInitFormRows from './CloudInitFormRows';
import { onDataChanged, onFormValueChanged, onSetIsForm } from './utils/Cloudinit';

import '../../../create-vm-wizard-footer.scss';
import './cloud-init.scss';

type CloudInitAdvancedTabProps = {
  wizardReduxID: string;
};

const CloudInitAdvancedTab: React.FC<CloudInitAdvancedTabProps> = ({ wizardReduxID }) => {
  const { t } = useTranslation();
  const asId = prefixedID.bind(null, 'cloudinit');
  const dispatch = useDispatch();
  const { iCloudInitStorage, isForm, isProviderImport, isDisabled } = useSelector((state) => ({
    iCloudInitStorage: iGetCloudInitNoCloudStorage(state, wizardReduxID),
    isForm: iGetCloudInitValue(state, wizardReduxID, CloudInitField.IS_FORM),
    isProviderImport: iGetCommonData(state, wizardReduxID, VMWizardProps.isProviderImport),
    isDisabled:
      hasStepCreateDisabled(state, wizardReduxID, VMWizardTab.ADVANCED) ||
      hasStepUpdateDisabled(state, wizardReduxID, VMWizardTab.ADVANCED) ||
      hasStepDeleteDisabled(state, wizardReduxID, VMWizardTab.ADVANCED),
  }));
  const [data, isBase64] = CloudInitDataHelper.getUserData(
    toShallowJS(iGetIn(iCloudInitStorage, ['volume', 'cloudInitNoCloud'])),
  );

  const isEditable =
    !isDisabled &&
    (!iCloudInitStorage || ihasIn(iCloudInitStorage, ['volume', 'cloudInitNoCloud'])); // different type, e.g. networkData is not editable

  return (
    <div className={isForm ? 'co-m-pane__body co-m-pane__form kubevirt-create-vm-modal__form' : ''}>
      {!isDisabled && !isEditable && (
        <Errors
          endMargin
          errors={[
            {
              title: t('kubevirt-plugin~Cloud-init volume exists but is not editable.'),
              variant: AlertVariant.info,
              key: 'not-editable',
            },
          ]}
        />
      )}
      <Form>
        {isDisabled && isProviderImport && (
          <Alert
            title={t('kubevirt-plugin~Partial data available prior to the import')}
            isInline
            variant={AlertVariant.info}
          >
            {t(
              'kubevirt-plugin~This wizard shows a partial data set. A complete data set is available for viewing when you complete the import process.',
            )}
          </Alert>
        )}
        <InlineBooleanRadio
          id="cloud-init-edit-mode"
          isDisabled={!isEditable}
          firstOptionLabel={t('kubevirt-plugin~Form')}
          secondOptionLabel={t('kubevirt-plugin~Custom script')}
          firstOptionChecked={isForm}
          onChange={(form) =>
            onSetIsForm(t, form, data, isBase64, iCloudInitStorage, wizardReduxID, dispatch)
          }
        />
        {!isForm && (
          <CloudInitCustomScript
            key="custom-data"
            id="cloudinit-custom"
            isDisabled={!isEditable}
            value={data}
            onChange={(value: string) =>
              onDataChanged(value, isBase64, iCloudInitStorage, wizardReduxID, dispatch)
            }
          />
        )}
        {isForm && (
          <CloudInitFormRows
            key="form-rows"
            id="cloudinit"
            isDisabled={!isEditable}
            value={data}
            onEntryChange={(key: string, value: string) =>
              onFormValueChanged(
                data,
                key,
                value,
                isBase64,
                iCloudInitStorage,
                wizardReduxID,
                dispatch,
              )
            }
          />
        )}
        <FormRow fieldId={asId('base64')}>
          <Checkbox
            className="kubevirt-create-vm-modal__cloud-init-base64"
            id={asId('base64')}
            isChecked={isBase64}
            isDisabled={!iCloudInitStorage || !isEditable}
            label={t('kubevirt-plugin~Base-64 encoded')}
            onChange={(checked) =>
              onDataChanged(data, checked, iCloudInitStorage, wizardReduxID, dispatch)
            }
          />
        </FormRow>
      </Form>
    </div>
  );
};

export default CloudInitAdvancedTab;
