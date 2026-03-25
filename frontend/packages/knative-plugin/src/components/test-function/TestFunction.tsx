import type { FC } from 'react';
import type { FormikValues, FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { coFetchJSON } from '@console/internal/co-fetch';
import type { ServiceKind } from '../../types';
import TestFunctionModal from './TestFunctionModal';
import type { TestFunctionFormikValues } from './types';
import { InvokeFormat } from './types';
import { generatePayload, parseResponse } from './utils';

export interface TestFunctionProps {
  service: ServiceKind;
  cancel?: () => void;
  close?: () => void;
}

const TestFunction: FC<TestFunctionProps> = ({ service, cancel, close }) => {
  const svcName = service.metadata.name;
  const svcNamespace = service.metadata.namespace;
  const initialValues: TestFunctionFormikValues = {
    request: {
      format: InvokeFormat.CloudEvent,
      contentType: 'application/json',
      isAdvancedSettingsExpanded: false,
      type: '',
      source: '',
      customHeaders: [[]],
      body: {
        data: '{"message": "Hello World!"}',
      },
    },
    response: {
      status: '',
      statusCode: null,
      header: {},
      body: '',
    },
  };

  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    coFetchJSON
      .post(
        `/api/console/knative/namespaces/${svcNamespace}/services/${svcName}/invoke`,
        generatePayload(values),
      )
      .then((res) => {
        parseResponse(res, action);
      })
      .catch((err) => {
        action.setFieldValue('response.status', err.message);
        action.setFieldValue('response.statusCode', 500);
        action.setFieldValue('response.body', `{ "error": "${err.message}" }`);
        action.setStatus({ error: err.message });
      });
  };
  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onReset={cancel}
      initialStatus={{ error: '' }}
    >
      {(formikProps) => (
        <TestFunctionModal {...formikProps} cancel={cancel} service={service} close={close} />
      )}
    </Formik>
  );
};
export default TestFunction;
