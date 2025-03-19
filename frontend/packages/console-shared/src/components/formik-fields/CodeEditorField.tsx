import * as React from 'react';
import { Switch } from '@patternfly/react-core';
import classNames from 'classnames';
import { FormikValues, useField, useFormikContext } from 'formik';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  useResolvedExtensions,
  isYAMLTemplate,
  YAMLTemplate,
  WatchK8sResource,
} from '@console/dynamic-plugin-sdk';
import { AsyncComponent } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleYAMLSampleModel } from '@console/internal/models';
import { getYAMLTemplates } from '@console/internal/models/yaml-templates';
import { definitionFor, K8sResourceCommon, referenceForModel } from '@console/internal/module/k8s';
import { getResourceSidebarSamples } from '../../utils';
import { CodeEditorFieldProps } from './field-types';

import './CodeEditorField.scss';

const SampleResource: WatchK8sResource = {
  kind: referenceForModel(ConsoleYAMLSampleModel),
  isList: true,
};

const CodeEditorField: React.FC<CodeEditorFieldProps> = ({
  name,
  label,
  model,
  schema,
  showSamples,
  showShortcuts,
  isMinimapVisible,
  minHeight,
  onSave,
  language,
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
  const hasSidebarContent = hasSchema || (showSamples && !isEmpty(samples)) || !isEmpty(snippets);

  const [templateExtensions] = useResolvedExtensions<YAMLTemplate>(isYAMLTemplate);

  const sanitizeYamlContent = React.useCallback(
    (id: string = 'default', yaml: string = '', kind: string) => {
      if (yaml) {
        return yaml;
      }
      const yamlByExtension: string = getYAMLTemplates(
        templateExtensions?.filter((e) => e.properties.model.kind === kind),
      ).getIn([kind, id]);
      return yamlByExtension?.trim() || '';
    },
    [templateExtensions],
  );

  return (
    <div className="osc-yaml-editor co-p-has-sidebar" data-test="yaml-editor">
      <div
        className={classNames('co-p-has-sidebar__body', {
          'co-p-has-sidebar__body--sidebar-open': sidebarOpen && hasSidebarContent,
        })}
      >
        <div className="osc-yaml-editor__editor">
          <AsyncComponent
            loader={() => import('../editor/CodeEditor').then((c) => c.default)}
            forwardRef={editorRef}
            value={field.value}
            minHeight={minHeight ?? '200px'}
            onChange={(yaml: string) => setFieldValue(name, yaml)}
            onSave={onSave}
            showShortcuts={showShortcuts}
            isMinimapVisible={isMinimapVisible}
            language={language}
            toolbarLinks={[
              hasSidebarContent && (
                <Switch
                  label={t('public~Sidebar')}
                  id="showSidebar"
                  isChecked={sidebarOpen}
                  data-checked-state={sidebarOpen}
                  onChange={() => setSidebarOpen(!sidebarOpen)}
                  hasCheckIcon
                />
              ),
            ]}
          />
        </div>
      </div>
      {sidebarOpen && hasSidebarContent && (
        <AsyncComponent
          loader={() => import('../editor/CodeEditorSidebar').then((c) => c.default)}
          editorRef={editorRef}
          model={model}
          schema={schema}
          samples={showSamples ? samples : []}
          snippets={snippets}
          sanitizeYamlContent={sanitizeYamlContent}
          sidebarLabel={label}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      )}
    </div>
  );
};

export default CodeEditorField;
