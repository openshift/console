import * as React from 'react';
import { FormProps } from 'react-jsonschema-form';
import { useField, useFormikContext, FormikValues } from 'formik';
import { AsyncComponent } from '@console/internal/components/utils';

type DynamicFormFieldProps = FormProps<any> & {
  name: string;
  errors?: string[];
  formDescription?: React.ReactNode;
};

const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  name,
  schema,
  uiSchema,
  errors,
  formDescription,
  formContext,
}) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();

  return (
    <div className="row" style={{ marginTop: `16px` }}>
      <div className="col-md-6 col-md-push-6 col-lg-6 col-lg-push-6">{formDescription}</div>
      <div className="col-md-6 col-md-pull-6 col-lg-6 col-lg-pull-6">
        <AsyncComponent
          loader={() => import('../dynamic-form').then((c) => c.DynamicForm)}
          errors={errors}
          formContext={formContext}
          uiSchema={uiSchema}
          formData={field.value}
          onChange={(data) => setFieldValue(name, data)}
          schema={schema}
          tagName="div"
          customUISchema
          noActions
          liveValidate
        />
      </div>
    </div>
  );
};

export default DynamicFormField;
