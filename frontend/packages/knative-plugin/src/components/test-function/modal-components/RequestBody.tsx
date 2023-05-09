import * as React from 'react';
import { FormikProps, FormikValues } from 'formik/dist/types';
import { CodeEditorField } from '@console/shared/src';
import { getcurrentLanguage } from '../utils';

const RequestBody: React.FC<FormikProps<FormikValues>> = ({ values }) => {
  const { contentType } = values.request;

  return (
    <div className="kn-test-sf-modal__editor">
      <CodeEditorField
        name="request.body.data"
        minHeight="460px"
        showSamples={false}
        showShortcuts={false}
        language={getcurrentLanguage(contentType)}
      />
    </div>
  );
};

export default RequestBody;
