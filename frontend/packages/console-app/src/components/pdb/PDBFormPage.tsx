import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { PageHeading } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sPodControllerKind, getGroupVersionKind } from '@console/internal/module/k8s';
import { SyncedEditor } from '@console/shared/src/components/synced-editor';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { PodDisruptionBudgetModel } from '../../models';
import { pdbToK8sResource } from './pdb-models';
import PDBForm from './PDBForm';
import { PodDisruptionBudgetKind } from './types';
import { getPDBResource } from './utils/get-pdb-resources';

const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'console.pdbForm.editor.lastView';

export const PDBFormPage: React.FC<{
  location: { search: string };
  match: Match;
}> = (props) => {
  const { t } = useTranslation();
  const match = {
    params: { ...props.match.params, plural: PodDisruptionBudgetModel.plural, appName: '' },
    isExact: true,
    url: '',
    path: '',
  };
  const { location } = props;
  const searchParams = new URLSearchParams(location.search);
  const name = searchParams.get('name');
  const groupVersionKind = getGroupVersionKind(match.params.resourceRef) || [];
  const [group, version, kind] = groupVersionKind;

  const [resource] = useK8sWatchResource<K8sPodControllerKind>({
    groupVersionKind: {
      group,
      kind,
      version,
    },
    name,
    namespaced: true,
    namespace: match.params.ns,
  });

  const [pdbResources] = useK8sWatchResource<PodDisruptionBudgetKind[]>({
    groupVersionKind: {
      group: PodDisruptionBudgetModel.apiGroup,
      kind: PodDisruptionBudgetModel.kind,
      version: PodDisruptionBudgetModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace: match.params.ns,
  });

  const existingResource = getPDBResource(pdbResources, resource);

  const formHelpText = t('console-app~Create by completing the form.');
  const yamlHelpText = t(
    'console-app~Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.',
  );
  const initialPDB = {
    name: '',
    namespace: match.params.ns,
    requirement: 'minAvailable',
    selector: {},
  };
  const [helpText, setHelpText] = React.useState(formHelpText);
  const k8sObj = pdbToK8sResource(initialPDB);
  const YAMLEditor: React.FC<YAMLEditorProps> = ({ onChange, initialYAML = '' }) => {
    return <CreateYAML hideHeader match={match} onChange={onChange} template={initialYAML} />;
  };

  const title = !existingResource
    ? t('console-app~Create {{label}}', { label: PodDisruptionBudgetModel.label })
    : t('console-app~Edit {{label}}', { label: PodDisruptionBudgetModel.label });

  return (
    <>
      <PageHeading title={title}>
        <span className="help-block">{helpText}</span>
      </PageHeading>

      <SyncedEditor
        context={{
          formContext: {
            existingResource,
            selector: resource?.spec?.template?.metadata?.labels,
            params: match.params,
          },
          yamlContext: {},
        }}
        FormEditor={PDBForm}
        initialData={k8sObj}
        initialType={EditorType.Form}
        onChangeEditorType={(type) =>
          setHelpText(type === EditorType.Form ? formHelpText : yamlHelpText)
        }
        YAMLEditor={YAMLEditor}
        lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
        displayConversionError
      />
    </>
  );
};

type YAMLEditorProps = {
  initialYAML?: string;
  onChange?: (yaml: string) => void;
};

type Match = {
  params: { ns: string; plural: string; appName: string; resourceRef: string };
  isExact: boolean;
  url: string;
  path: string;
};
