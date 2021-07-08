import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { FormikValues, useField, useFormikContext } from 'formik';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { AsyncComponent } from '@console/internal/components/utils';
import {
  useK8sWatchResource,
  WatchK8sResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleYAMLSampleModel } from '@console/internal/models';
import { definitionFor, K8sResourceCommon, referenceForModel } from '@console/internal/module/k8s';
import { getResourceSidebarSamples } from '../../utils';
import { YAMLEditorFieldProps } from './field-types';

import './YAMLEditorField.scss';

const SampleResource: WatchK8sResource = {
  kind: referenceForModel(ConsoleYAMLSampleModel),
  isList: true,
};

const YAMLEditorField: React.FC<YAMLEditorFieldProps> = ({
  name,
  label,
  model,
  schema,
  onSave,
}) => {
  const [field] = useField(name);
  const { setFieldValue } = useFormikContext<FormikValues>();
  const { t } = useTranslation();
  const editorRef = React.useRef();

  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(true);

  const [sampleResources, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>(
    SampleResource,
  );

  const { samples, snippets } = model
    ? getResourceSidebarSamples(
        model,
        {
          data: sampleResources,
          loaded,
          loadError,
        },
        t,
      )
    : { samples: [], snippets: [] };

  const definition = model ? definitionFor(model) : { properties: [] };
  const hasSchema = !!schema || (!!definition && !isEmpty(definition.properties));
  const hasSidebarContent = hasSchema || !isEmpty(samples) || !isEmpty(snippets);

  return (
    <div className="osc-yaml-editor">
      <div className="osc-yaml-editor__editor">
        <AsyncComponent
          loader={() => import('../editor/YAMLEditor').then((c) => c.default)}
          forwardRef={editorRef}
          value={field.value}
          minHeight="200px"
          onChange={(yaml: string) => setFieldValue(name, yaml)}
          onSave={onSave}
          showShortcuts
          toolbarLinks={
            !sidebarOpen &&
            hasSidebarContent && [
              <Button isInline variant="link" onClick={() => setSidebarOpen(true)}>
                <InfoCircleIcon className="co-icon-space-r co-p-has-sidebar__sidebar-link-icon" />
                {t('console-shared~View sidebar')}
              </Button>,
            ]
          }
        />
      </div>
      {sidebarOpen && hasSidebarContent && (
        <div className="osc-yaml-editor__sidebar">
          <AsyncComponent
            loader={() => import('../editor/YAMLEditorSidebar').then((c) => c.default)}
            editorRef={editorRef}
            model={model}
            schema={schema}
            samples={samples}
            snippets={snippets}
            sidebarLabel={label}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
      )}
    </div>
  );
};

export default YAMLEditorField;
