import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { coFetchJSON } from '@console/internal/co-fetch';
import { ServiceKind } from '../../types';
import TestFunctionModal from './TestFunctionModal';
import { InvokeFormat, TestFunctionFormikValues } from './types';
import { generatePayload, parseResponse } from './utils';

export interface TestFunctionProps {
  service: ServiceKind;
  cancel?: () => void;
  close?: () => void;
}

const TestFunction: React.FC<TestFunctionProps> = ({ service, cancel, close }) => {
  const svcName = service.data.metadata.name;
  const svcNamespace = service.data.metadata.namespace;
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
