import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { isEmpty } from 'lodash';
import { FormikValues, useField, useFormikContext } from 'formik';
import { Button } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { AsyncComponent } from '@console/internal/components/utils';
import { definitionFor } from '@console/internal/module/k8s';
import { YAMLEditorFieldProps } from './field-types';

import './YAMLEditorField.scss';

const YAMLEditorField: React.FC<YAMLEditorFieldProps> = ({
  name,
  onSave,
  schema,
  schemaModel,
  schemaLabel,
}) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();
  const { t } = useTranslation();

  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);
  const definition = schemaModel ? definitionFor(schemaModel) : { properties: [] };
  const showSchema = schema || (definition && !isEmpty(definition.properties));

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
                {t('console-shared~View sidebar')}
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
            schema={schema}
            sidebarLabel={schemaLabel}
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
