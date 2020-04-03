import * as React from 'react';
import { AsyncComponent } from '@console/internal/components/utils/async';

const NameValueEditorComponent = (props) => (
  <AsyncComponent
    loader={() =>
      import('@console/internal/components/utils/name-value-editor').then((c) => c.NameValueEditor)
    }
    {...props}
  />
);

export default NameValueEditorComponent;
