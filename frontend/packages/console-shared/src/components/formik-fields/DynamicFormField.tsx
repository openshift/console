import * as React from 'react';
import cx from 'classnames';
import { useField, useFormikContext, FormikValues } from 'formik';
import { FormProps } from 'react-jsonschema-form';
import { AsyncComponent } from '@console/internal/components/utils';

type DynamicFormFieldProps = FormProps<any> & {
  name: string;
  errors?: string[];
  formDescription?: React.ReactNode;
  showAlert?: boolean;
};

const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  name,
  schema,
  uiSchema,
  errors,
  formDescription,
  formContext,
  showAlert,
}) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();

  return (
    <div className={cx({ row: formDescription })}>
      <div
        className={cx({
          'col-sm-12 col-md-4 col-md-push-8 col-lg-5 col-lg-push-7': formDescription,
        })}
      >
        {formDescription}
      </div>
      <div
        className={cx({
          'col-sm-12 col-md-8 col-md-pull-4 col-lg-7 col-lg-pull-5': formDescription,
        })}
      >
        <AsyncComponent
          loader={() => import('../dynamic-form').then((c) => c.DynamicForm)}
          errors={errors}
          formContext={formContext}
          showAlert={showAlert}
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
