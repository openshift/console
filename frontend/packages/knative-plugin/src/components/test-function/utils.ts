import { FormikHelpers, FormikValues } from 'formik/dist/types';
import { InvokeFormat } from './types';

export const getcurrentLanguage = (contentType: string) => {
  if (contentType.startsWith('application/json')) {
    return 'json';
  }
  if (contentType.startsWith('application/yaml')) {
    return 'yaml';
  }
  return 'plaintext';
};

export const generatePayload = (values: FormikValues) => {
  const { format, contentType, customHeaders, type, source, body } = values.request;

  const cloudEventHeaders = {
    'ce-source': [...(type ? [type] : ['boson.fn'])],
    'ce-type': [...(source ? [source] : ['/boson/fn'])],
  };

  const httpHeaders = {
    type: [...(type ? [type] : ['boson.fn'])],
    source: [...(source ? [source] : ['/boson/fn'])],
  };

  const additionalHeaders = customHeaders.reduce((acc, [key, value]) => {
    if (key !== '' && value) {
      acc[key] = [...(acc[key] ?? []), value];
    }
    return acc;
  }, {});

  const payload = {
    allowInsecure: true,
    body: {
      'invoke-header': {
        ...(format === InvokeFormat.CloudEvent ? cloudEventHeaders : httpHeaders),
        ...additionalHeaders,
      },
      'invoke-query': {},
      'invoke-message': body.data,
      'invoke-format': format === InvokeFormat.CloudEvent ? 'ce' : 'http',
      'invoke-contentType': contentType,
    },
  };

  return payload;
};

export const parseResponse = (response: any, action: FormikHelpers<FormikValues>) => {
  const { setFieldValue, setStatus } = action;
  const { status, statusCode, header, body } = response;

  if (statusCode === 200) {
    setFieldValue('response.status', status);
    setFieldValue('response.statusCode', 200);
    setFieldValue('response.header', header);
    setFieldValue('response.body', body);
    setStatus({ error: '' });
  } else {
    setStatus({ error: body });
    setFieldValue('response.body', `{ "error": ${body} }`);
    setFieldValue('response.status', status);
    setFieldValue('response.statusCode', statusCode);
  }
};

export const clearResponseValues = (props: FormikHelpers<FormikValues>) => {
  const { setFieldValue } = props;
  setFieldValue('response.body', '');
  setFieldValue('response.statusCode', null);
  setFieldValue('response.header', {});
  setFieldValue('response.status', '');
};
