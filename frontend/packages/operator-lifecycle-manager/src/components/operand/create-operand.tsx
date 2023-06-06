import * as React from 'react';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { match as RouterMatch } from 'react-router';
import { useParams } from 'react-router-dom';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import {
  PageHeading,
  StatusBox,
  resourcePathFromModel,
  AsyncComponent,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import {
  K8sResourceKind,
  K8sResourceKindReference,
  kindForReference,
  nameForModel,
  CustomResourceDefinitionKind,
  definitionFor,
} from '@console/internal/module/k8s';
import { getBadgeFromType } from '@console/shared/src/components/badges';
import {
  getSchemaErrors,
  hasNoFields,
  prune,
} from '@console/shared/src/components/dynamic-form/utils';
import { ErrorBoundaryPage } from '@console/shared/src/components/error';
import { SyncedEditor } from '@console/shared/src/components/synced-editor';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { useCreateResourceExtension } from '@console/shared/src/hooks/create-resource-hook';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { RouteParams } from '@console/shared/src/types';
import { exampleForModel, providedAPIForModel } from '..';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind, ProvidedAPI } from '../../types';
import { useClusterServiceVersion } from '../../utils/useClusterServiceVersion';
import ModelStatusBox from '../model-status-box';
import { DEFAULT_K8S_SCHEMA } from './const';
// eslint-disable-next-line @typescript-eslint/naming-convention
import { DEPRECATED_CreateOperandForm } from './DEPRECATED_operand-form';
import { OperandForm } from './operand-form';
import { OperandYAML } from './operand-yaml';

export const CreateOperand: React.FC<CreateOperandProps> = ({
  initialEditorType,
  match,
  csv,
  loaded,
  loadError,
}) => {
  const { t } = useTranslation();
  const [model] = useK8sModel(match.params.plural);
  const [crd] = useK8sWatchResource<CustomResourceDefinitionKind>(
    model
      ? {
          kind: CustomResourceDefinitionModel.kind,
          isList: false,
          name: nameForModel(model),
        }
      : undefined,
  );

  const formHelpText = t(
    'olm~Create by completing the form. Default values may be provided by the Operator authors.',
  );

  const [activePerspective] = useActivePerspective();
  const [helpText, setHelpText] = React.useState(formHelpText);
  const next =
    activePerspective === 'dev'
      ? '/topology'
      : `${resourcePathFromModel(
          ClusterServiceVersionModel,
          match.params.csvName,
          match.params.ns,
        )}/${match.params.plural}`;

  const providedAPI = React.useMemo<ProvidedAPI>(() => providedAPIForModel(csv, model), [
    csv,
    model,
  ]);

  const baseSchema = React.useMemo(
    () =>
      crd?.spec?.versions?.find?.((version) => version.name === providedAPI?.version)?.schema
        ?.openAPIV3Schema ?? (definitionFor(model) as JSONSchema7),
    [crd, model, providedAPI],
  );

  // TODO This logic should be removed in a later release and we should only be using the
  // OperandForm component. We are providing a temporary fallback to the old form component to ease
  // the transition to structural schemas over descriptors. Once structural schemas are required,
  // the fallback will no longer be necessary. If no structural schema is provided after this
  // fallback is fully deprecated, a form will not be generated.
  const [schema, FormComponent] = React.useMemo(() => {
    const useFallback =
      getSchemaErrors(baseSchema).length ||
      hasNoFields((baseSchema?.properties?.spec ?? {}) as JSONSchema7);
    return useFallback
      ? // eslint-disable-next-line @typescript-eslint/naming-convention
        [baseSchema, DEPRECATED_CreateOperandForm]
      : [
          _.defaultsDeep({}, DEFAULT_K8S_SCHEMA, _.omit(baseSchema, 'properties.status')),
          OperandForm,
        ];
  }, [baseSchema]);

  const sample = React.useMemo<K8sResourceKind>(() => exampleForModel(csv, model), [csv, model]);

  const pruneFunc = React.useCallback((data) => prune(data, sample), [sample]);

  const onChangeEditorType = React.useCallback(
    (newMethod) => {
      setHelpText(
        newMethod === EditorType.Form
          ? formHelpText
          : t(
              'olm~Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.',
            ),
      );
    },
    [formHelpText, t],
  );

  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'console.createOperandForm.editor.lastView';

  return (
    <StatusBox loaded={loaded} loadError={loadError} data={csv}>
      <PageHeading
        title={t('olm~Create {{item}}', { item: model.label })}
        badge={getBadgeFromType(model.badge)}
        helpText={helpText}
      />
      <SyncedEditor
        context={{
          formContext: { csv, match, model, next, schema, providedAPI },
          yamlContext: { next, match },
        }}
        FormEditor={FormComponent}
        initialData={sample}
        initialType={initialEditorType}
        onChangeEditorType={onChangeEditorType}
        prune={pruneFunc}
        YAMLEditor={OperandYAML}
        lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
      />
    </StatusBox>
  );
};

type CreateOperandPageRouteParams = RouteParams<'csvName' | 'ns'>;

const CreateOperandPage: React.FC<CreateOperandPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const createResourceExtension = useCreateResourceExtension(match.params.plural);
  const { csvName, ns } = useParams<CreateOperandPageRouteParams>();
  const [csv, loaded, loadError] = useClusterServiceVersion(csvName, ns);

  return (
    <>
      <Helmet>
        <title>{t('olm~Create {{item}}', { item: kindForReference(match.params.plural) })}</title>
      </Helmet>
      <ModelStatusBox groupVersionKind={match.params.plural}>
        {createResourceExtension ? (
          <ErrorBoundaryPage>
            <AsyncComponent
              loader={createResourceExtension.properties.component}
              namespace={match.params.ns}
            />
          </ErrorBoundaryPage>
        ) : (
          <CreateOperand
            match={match}
            initialEditorType={EditorType.Form}
            csv={csv}
            loaded={loaded}
            loadError={loadError}
          />
        )}
      </ModelStatusBox>
    </>
  );
};

export default CreateOperandPage;

export type CreateOperandProps = {
  initialEditorType: EditorType;
  match: RouterMatch<{ csvName: string; ns: string; plural: K8sResourceKindReference }>;
  csv: ClusterServiceVersionKind;
  loaded: boolean;
  loadError: any;
};

export type CreateOperandPageProps = {
  match: CreateOperandProps['match'];
};
