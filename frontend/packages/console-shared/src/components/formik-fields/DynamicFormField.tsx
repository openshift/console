import * as React from 'react';
import { FormProps } from 'react-jsonschema-form';
import { useField, useFormikContext, FormikValues } from 'formik';
import { Grid, GridItem } from '@patternfly/react-core';
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
    <Grid gutter="md">
      <GridItem xl={6} lg={6} md={12} sm={12}>
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
      </GridItem>
      <GridItem xl={6} lg={6} md={12} sm={12}>
        {formDescription}
      </GridItem>
    </Grid>
  );
};

export default DynamicFormField;
