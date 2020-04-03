import * as React from 'react';
import { Form, FormProps } from '@patternfly/react-core';

interface FlexFormProps {
  children?: React.ReactNode;
}

const FlexForm: React.FC<FlexFormProps & FormProps> = ({ children, ...props }) => (
  <Form {...props} style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
    {children}
  </Form>
);

export default FlexForm;
