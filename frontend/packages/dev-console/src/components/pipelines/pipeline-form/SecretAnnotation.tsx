import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField, DropdownField } from '@console/shared';
import { SecretAnnotationType } from '../const';

type SecretAnnotationParam = {
  fieldName: string;
  isReadOnly?: boolean;
};

const SecretAnnotation: React.FC<SecretAnnotationParam> = (props) => {
  const { fieldName, isReadOnly = false } = props;
  return (
    <div className="row">
      <div className="col-lg-6">
        <DropdownField
          name={`${fieldName}.key`}
          items={SecretAnnotationType}
          label="Access to"
          disabled={isReadOnly}
          fullWidth
          required
        />
      </div>
      <div className="col-lg-6">
        <InputField
          name={`${fieldName}.value`}
          type={TextInputTypes.text}
          isReadOnly={isReadOnly}
          label="Server URL"
          required
        />
      </div>
    </div>
  );
};

export default SecretAnnotation;
