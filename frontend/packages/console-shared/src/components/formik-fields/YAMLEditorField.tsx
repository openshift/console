import * as React from 'react';
import { isEmpty } from 'lodash';
import { FormikValues, useField, useFormikContext } from 'formik';
import { Button } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { AsyncComponent } from '@console/internal/components/utils';
import { definitionFor } from '@console/internal/module/k8s';
import { YAMLEditorFieldProps } from './field-types';

import './YAMLEditorField.scss';

const YAMLEditorField: React.FC<YAMLEditorFieldProps> = ({ name, onSave, schemaModel }) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();

  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);
  const definition = schemaModel ? definitionFor(schemaModel) : { properties: [] };
  const showSchema = definition && !isEmpty(definition.properties);

  return (
    <div className="osc-yaml-editor">
      <div className="osc-yaml-editor__editor">
        <AsyncComponent
          loader={() => import('../editor/YAMLEditor').then((c) => c.default)}
          value={field.value}
          minHeight="200px"
          onChange={(yaml: string) => setFieldValue(name, yaml)}
          onSave={onSave}
          showShortcuts
          toolbarLinks={
            !sidebarOpen &&
            showSchema && [
              <Button isInline variant="link" onClick={() => setSidebarOpen(true)}>
                <InfoCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />
                View sidebar
              </Button>,
            ]
          }
        />
      </div>
      {sidebarOpen && showSchema && (
        <div className="osc-yaml-editor__sidebar">
          <AsyncComponent
            loader={() =>
              import('@console/internal/components/sidebars/resource-sidebar').then(
                (c) => c.ResourceSidebar,
              )
            }
            kindObj={schemaModel}
            showSidebar={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            showSchema={showSchema}
          />
        </div>
      )}
    </div>
  );
};

export default YAMLEditorField;
