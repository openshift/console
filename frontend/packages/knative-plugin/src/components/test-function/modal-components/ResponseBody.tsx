import * as React from 'react';
import { FormikProps, FormikValues } from 'formik/dist/types';
import { CodeEditorField } from '@console/shared/src';
import { getcurrentLanguage } from '../utils';

const ResponseBody: React.FC<FormikProps<FormikValues>> = ({ values }) => {
  const contentType: string[] = values.response.headers['content-type'];
  return (
    <div className="kn-test-sf-modal__editor">
      <CodeEditorField
        name="response.body"
        minHeight="460px"
        showSamples={false}
        showShortcuts={false}
        language={getcurrentLanguage(contentType[0])}
      />
    </div>
  );
};

export default ResponseBody;
