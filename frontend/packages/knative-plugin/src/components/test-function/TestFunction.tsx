import * as React from 'react';
import { Formik, FormikValues, FormikHelpers } from 'formik';
import { ServiceKind } from '../../types';
import TestFunctionModal from './TestFunctionModal';
import { InvokeFormat } from './types';

export interface TestFunctionProps {
  service: ServiceKind;
  cancel?: () => void;
  close?: () => void;
}

export type TestFunctionFormikValues = {
  request: {
    format: InvokeFormat;
    contentType: string;
    type: string;
    source: string;
    customHeaders: string[][];
    body: {
      data: string;
    };
  };
  response: {
    url: string;
    status: string;
    statusCode: number;
    headers: Record<string, string[]>;
    body: string;
  };
  endpoint: {
    url: URL | string;
  };
};

const TestFunction: React.FC<TestFunctionProps> = ({ service, cancel, close }) => {
  const initialValues: TestFunctionFormikValues = {
    request: {
      format: InvokeFormat.CloudEvent,
      contentType: 'application/json',
      type: '',
      source: '',
      customHeaders: [[]],
      body: {
        data: '{"message": "Hello World!"}',
      },
    },
    response: {
      url: '',
      status: '',
      statusCode: 0,
      headers: {
        'content-type': ['application/json'],
        'ce-type': ['boson.fn'],
        'ce-source': ['/boson/fn'],
        'ce-hello': ['World', 'sds'],
        'ce-lorem': ['Ipsum'],
      },
      body: '{"message": "Response Data!"}',
    },
    endpoint: {
      url: '',
    },
  };

  const handleSubmit = (values: FormikValues, action: FormikHelpers<FormikValues>) => {
    // eslint-disable-next-line no-console
    console.log('!!!Invoking Function!!!');
    action.setStatus({ error: '' });
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
