import { connect } from 'react-redux';
import * as React from 'react';
import { FileUpload } from '@patternfly/react-core';
import { ValidationErrorType, ValidationObject } from '@console/shared/src/utils/validation/types';
import { iGetOvirtField } from '../../../../selectors/immutable/provider/ovirt/selectors';
import { VMImportProvider, OvirtProviderField } from '../../../../types';
import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import { iGet } from '../../../../../../utils/immutable';
import { FormField, FormFieldType } from '../../../../form/form-field';
import { FormFieldRow } from '../../../../form/form-field-row';
import { getFieldId } from '../../../../utils/renderable-field-utils';

const MAX_CERT_SIZE = 10 * 1024 * 1024;
const MAX_CERT_SIZE_MSG = 'Maximum allowed size is 10 MiB';
const READ_FAILED_MSG = 'Read failed';

const OvirtCertificateConnected: React.FC<OvirtCertificateProps> = React.memo(
  ({ certField, onCertChange }) => {
    const mounted = React.useRef(true);
    React.useEffect(() => () => (mounted.current = false), []);

    const [isCertFileLoading, setCertFileLoading] = React.useState(false);
    const [lastError, setLastError] = React.useState(null);

    const additionalValidation: ValidationObject = lastError
      ? { message: lastError, type: ValidationErrorType.Error }
      : undefined;

    const onCertificateChange = React.useCallback(
      (value: string, filename: string) => {
        if (mounted.current) {
          if (lastError && !filename) {
            setLastError(null);
          }
          onCertChange(value, filename);
        }
      },
      [lastError, onCertChange],
    );

    const onCertFileReadStarted = React.useCallback(() => {
      if (mounted.current) {
        setCertFileLoading(true);
        setLastError(null);
      }
    }, []);
    const onCertFileReadFinished = React.useCallback(
      () => mounted.current && setCertFileLoading(false),
      [],
    );

    const onCertFileRejected = React.useCallback(() => {
      if (mounted.current) {
        setCertFileLoading(false);
        setLastError(MAX_CERT_SIZE_MSG);
      }
    }, []);

    const onCertFileReadFailed = React.useCallback(() => {
      if (mounted.current) {
        setCertFileLoading(false);
        setLastError(READ_FAILED_MSG);
      }
    }, []);

    return (
      <FormFieldRow
        field={certField}
        fieldType={FormFieldType.FILE_UPLOAD}
        validation={additionalValidation}
        fieldHelp={
          <a
            href="https://ovirt.github.io/ovirt-engine-api-model/master/#_obtaining_the_ca_certificate"
            target="_blank"
            rel="noopener noreferrer"
          >
            Obtaining the CA certificate
          </a>
        }
      >
        <FormField>
          <FileUpload
            id={getFieldId(OvirtProviderField.CERTIFICATE)}
            type="text"
            filename={iGet(certField, 'filename')}
            onReadStarted={onCertFileReadStarted}
            onReadFinished={onCertFileReadFinished}
            onReadFailed={onCertFileReadFailed}
            isLoading={isCertFileLoading}
            onChange={onCertificateChange}
            dropzoneProps={{
              maxSize: MAX_CERT_SIZE,
              onDropRejected: onCertFileRejected,
            }}
          />
        </FormField>
      </FormFieldRow>
    );
  },
);

type OvirtCertificateProps = {
  certField: any;
  onCertChange: (value: string, filename: string) => void;
};

const stateToProps = (state, { wizardReduxID }) => ({
  certField: iGetOvirtField(state, wizardReduxID, OvirtProviderField.CERTIFICATE),
});

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  onCertChange: (value: string, filename: string) =>
    dispatch(
      vmWizardActions[ActionType.UpdateImportProviderField](
        wizardReduxID,
        VMImportProvider.OVIRT,
        OvirtProviderField.CERTIFICATE,
        { value, filename },
      ),
    ),
});

export const OvirtCertificate = connect(stateToProps, dispatchToProps)(OvirtCertificateConnected);
