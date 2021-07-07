import * as React from 'react';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { match as RouterMatch } from 'react-router';
import {
  PageHeading,
  StatusBox,
  BreadCrumbs,
  resourcePathFromModel,
  AsyncComponent,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import {
  K8sResourceKind,
  K8sResourceKindReference,
  kindForReference,
  referenceForModel,
  nameForModel,
  CustomResourceDefinitionKind,
  definitionFor,
} from '@console/internal/module/k8s';
import { useActivePerspective } from '@console/shared';
import { getBadgeFromType } from '@console/shared/src/components/badges';
import {
  getSchemaErrors,
  hasNoFields,
  prune,
} from '@console/shared/src/components/dynamic-form/utils';
import { SyncedEditor } from '@console/shared/src/components/synced-editor';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { useCreateResourceExtension } from '@console/shared/src/hooks/create-resource-hook';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { exampleForModel, providedAPIForModel } from '..';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind, ProvidedAPI } from '../../types';
import { DEFAULT_K8S_SCHEMA } from './const';
// eslint-disable-next-line @typescript-eslint/camelcase
import { DEPRECATED_CreateOperandForm } from './DEPRECATED_operand-form';
import { OperandForm } from './operand-form';
import { OperandYAML } from './operand-yaml';

import './create-operand.scss';

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
      ? // eslint-disable-next-line @typescript-eslint/camelcase
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

  return (
    <StatusBox loaded={loaded} loadError={loadError} data={csv}>
      <div className="co-create-operand__header">
        <PageHeading
          badge={getBadgeFromType(model.badge)}
          className="olm-create-operand__page-heading"
          title={t('olm~Create {{item}}', { item: model.label })}
        >
          <span className="help-block">{helpText}</span>
        </PageHeading>
      </div>
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
      />
    </StatusBox>
  );
};

const CreateOperandPage: React.FC<CreateOperandPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const createResourceExtension = useCreateResourceExtension(match.params.plural);
  const [csv, loaded, loadError] = useK8sWatchResource<ClusterServiceVersionKind>({
    kind: referenceForModel(ClusterServiceVersionModel),
    name: match.params.csvName,
    namespace: match.params.ns,
    isList: false,
  });
  const [model] = useK8sModel(match.params.plural);

  return (
    <>
      <Helmet>
        <title>{t('olm~Create {{item}}', { item: kindForReference(match.params.plural) })}</title>
      </Helmet>
      {loaded && !_.isEmpty(csv) && model && (
        <div className="co-create-operand__breadcrumbs">
          <BreadCrumbs
            breadcrumbs={[
              {
                name: csv.spec.displayName,
                path: resourcePathFromModel(
                  ClusterServiceVersionModel,
                  csv.metadata.name,
                  csv.metadata.namespace,
                ),
              },
              {
                name: t('olm~Create {{item}}', { item: model.label }),
                path: window.location.pathname,
              },
            ]}
          />
        </div>
      )}
      {createResourceExtension ? (
        <AsyncComponent
          loader={createResourceExtension.properties.component}
          namespace={match.params.ns}
        />
      ) : (
        <CreateOperand
          match={match}
          initialEditorType={EditorType.Form}
          csv={csv}
          loaded={loaded}
          loadError={loadError}
        />
      )}
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
