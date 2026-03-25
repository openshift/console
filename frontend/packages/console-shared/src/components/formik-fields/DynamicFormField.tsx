import type { ReactNode, FC } from 'react';
import { Grid, GridItem } from '@patternfly/react-core';
import type { FormProps } from '@rjsf/core';
import type { FormikValues } from 'formik';
import { useField, useFormikContext } from 'formik';
import { AsyncComponent } from '@console/internal/components/utils/async';

type DynamicFormFieldProps = FormProps<any> & {
  name: string;
  errors?: string[];
  formDescription?: ReactNode;
  showAlert?: boolean;
};

const DynamicFormField: FC<DynamicFormFieldProps> = ({
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
    <Grid hasGutter>
      {formDescription && (
        <GridItem md={4} lg={5} order={{ default: '0', md: '1' }}>
          {formDescription}
        </GridItem>
      )}
      <GridItem
        md={formDescription ? 8 : 12}
        lg={formDescription ? 7 : 12}
        order={{ default: '1', md: '0' }}
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
      </GridItem>
    </Grid>
  );
};

export default DynamicFormField;
