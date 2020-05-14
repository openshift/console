import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField, DropdownField } from '@console/shared';
import { SecretAnnotationType } from '../../const';
import './SecretAnnotation.scss';

type SecretAnnotationParam = {
  fieldName: string;
  isReadOnly?: boolean;
};

const SecretAnnotation: React.FC<SecretAnnotationParam> = (props) => {
  const { fieldName, isReadOnly = false } = props;
  return (
    <div className="odc-secret-annotation">
      <p className="odc-secret-annotation__label">Designate provider to be authenticated</p>
      <div className="form-group">
        <DropdownField
          name={`${fieldName}.key`}
          items={SecretAnnotationType}
          label="Access to"
          disabled={isReadOnly}
          fullWidth
          required
        />
      </div>
      <div className="form-group">
        <InputField
          name={`${fieldName}.value`}
          helpText="The base server url (e.g. https://github.com)"
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
