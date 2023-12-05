import * as React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { PageHeading, LoadingBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sPodControllerKind, getGroupVersionKind } from '@console/internal/module/k8s';
import { SyncedEditor } from '@console/shared/src/components/synced-editor';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { PodDisruptionBudgetModel } from '../../models';
import { pdbToK8sResource, mergeInitialYAMLWithExistingResource } from './pdb-models';
import PDBForm from './PDBForm';
import { PodDisruptionBudgetKind } from './types';
import { getPDBResource } from './utils/get-pdb-resources';

const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'console.pdbForm.editor.lastView';

export const PDBFormPage: React.FC<{}> = () => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const match = {
    params: { ...params, plural: PodDisruptionBudgetModel.plural, appName: '' },
    isExact: true,
    url: '',
    path: '',
  };
  const searchParams = new URLSearchParams(location.search);
  const name = searchParams.get('name');
  const groupVersionKind = getGroupVersionKind(params.resourceRef) || [];
  const [group, version, kind] = groupVersionKind;

  const [resource, loadedResource] = useK8sWatchResource<K8sPodControllerKind>({
    groupVersionKind: {
      group,
      kind,
      version,
    },
    name,
    namespaced: true,
    namespace: params.ns,
  });

  const [pdbResources, loadedPDBResource] = useK8sWatchResource<PodDisruptionBudgetKind[]>({
    groupVersionKind: {
      group: PodDisruptionBudgetModel.apiGroup,
      kind: PodDisruptionBudgetModel.kind,
      version: PodDisruptionBudgetModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace: params.ns,
  });

  const existingResource = getPDBResource(pdbResources, resource);

  const formHelpText = t('console-app~Create by completing the form.');
  const yamlHelpText = t(
    'console-app~Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.',
  );
  const initialPDB = {
    name: '',
    namespace: params.ns,
    selector: { matchLabels: resource?.spec?.template?.metadata?.labels } || {},
  };
  const [helpText, setHelpText] = React.useState(formHelpText);
  const k8sObj = pdbToK8sResource(initialPDB);

  const YAMLEditor: React.FC<YAMLEditorProps> = ({ onChange, initialYAML = '' }) => {
    const yamlData = mergeInitialYAMLWithExistingResource(initialYAML, existingResource);

    return (
      <CreateYAML
        hideHeader
        onChange={onChange}
        match={match}
        template={safeJSToYAML(yamlData, 'yamlData', {
          skipInvalid: true,
        })}
        isCreate={!existingResource}
      />
    );
  };

  const title = !existingResource
    ? t('console-app~Create {{label}}', { label: PodDisruptionBudgetModel.label })
    : t('console-app~Edit {{label}}', { label: PodDisruptionBudgetModel.label });
  const stillLoading = !loadedResource || !loadedPDBResource;

  return (
    <>
      {stillLoading ? (
        <LoadingBox />
      ) : (
        <>
          <PageHeading
            title={title}
            helpText={
              <Trans t={t} ns="console-app">
                {helpText}
              </Trans>
            }
          />

          <SyncedEditor
            context={{
              formContext: {
                existingResource,
                params: match.params,
              },
              yamlContext: {},
            }}
            FormEditor={PDBForm}
            initialData={existingResource || k8sObj}
            initialType={EditorType.Form}
            onChangeEditorType={(type) =>
              setHelpText(type === EditorType.Form ? formHelpText : yamlHelpText)
            }
            YAMLEditor={YAMLEditor}
            lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
            displayConversionError
          />
        </>
      )}
    </>
  );
};

type YAMLEditorProps = {
  initialYAML?: string;
  onChange?: (yaml: string) => void;
};
