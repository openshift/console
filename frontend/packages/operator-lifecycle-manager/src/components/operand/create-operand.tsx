import * as React from 'react';
import { JSONSchema6 } from 'json-schema';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { match as RouterMatch } from 'react-router';
import {
  PageHeading,
  StatusBox,
  FirehoseResult,
  BreadCrumbs,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import { Firehose } from '@console/internal/components/utils/firehose';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import {
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  kindForReference,
  referenceForModel,
  nameForModel,
  CustomResourceDefinitionKind,
  definitionFor,
} from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { useActivePerspective } from '@console/shared';
import { getBadgeFromType } from '@console/shared/src/components/badges';
import {
  getSchemaErrors,
  hasNoFields,
  prune,
} from '@console/shared/src/components/dynamic-form/utils';
import { SyncedEditor } from '@console/shared/src/components/synced-editor';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
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
  clusterServiceVersion,
  customResourceDefinition,
  initialEditorType,
  loaded,
  loadError,
  match,
  model,
}) => {
  const { t } = useTranslation();

  const formHelpText = t(
    'olm~Create by completing the form. Default values may be provided by the Operator authors.',
  );

  const { data: csv } = clusterServiceVersion;
  const { data: crd } = customResourceDefinition;
  const [activePerspective] = useActivePerspective();
  const [helpText, setHelpText] = React.useState(formHelpText);
  const next =
    activePerspective === 'dev'
      ? '/topology'
      : `${resourcePathFromModel(
          ClusterServiceVersionModel,
          match.params.appName,
          match.params.ns,
        )}/${match.params.plural}`;

  const providedAPI = React.useMemo<ProvidedAPI>(() => providedAPIForModel(csv, model), [
    csv,
    model,
  ]);

  const baseSchema = React.useMemo(
    () =>
      crd?.spec?.versions?.find?.((version) => version.name === providedAPI?.version)?.schema
        ?.openAPIV3Schema ?? (definitionFor(model) as JSONSchema6),
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
      hasNoFields((baseSchema?.properties?.spec ?? {}) as JSONSchema6);
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
    <StatusBox loaded={loaded} loadError={loadError} data={clusterServiceVersion}>
      {loaded ? (
        <>
          <div className="co-create-operand__header">
            <div className="co-create-operand__header-buttons">
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
        </>
      ) : null}
    </StatusBox>
  );
};

const stateToProps = (state: RootState, props: Omit<CreateOperandPageProps, 'model'>) => ({
  model: state.k8s.getIn(['RESOURCES', 'models', props.match.params.plural]) as K8sKind,
});

export const CreateOperandPage = connect(stateToProps)((props: CreateOperandPageProps) => {
  const { t } = useTranslation();
  return (
    <>
      <Helmet>
        <title>
          {t('olm~Create {{item}}', { item: kindForReference(props.match.params.plural) })}
        </title>
      </Helmet>
      {props.model && (
        <Firehose
          resources={[
            {
              kind: referenceForModel(ClusterServiceVersionModel),
              name: props.match.params.appName,
              namespace: props.match.params.ns,
              isList: false,
              prop: 'clusterServiceVersion',
            },
            {
              kind: CustomResourceDefinitionModel.kind,
              isList: false,
              name: nameForModel(props.model),
              prop: 'customResourceDefinition',
              optional: true,
            },
          ]}
        >
          {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
          <CreateOperand
            {...(props as any)}
            model={props.model}
            match={props.match}
            initialEditorType={EditorType.Form}
          />
        </Firehose>
      )}
    </>
  );
});

export type CreateOperandProps = {
  clusterServiceVersion: FirehoseResult<ClusterServiceVersionKind>;
  customResourceDefinition?: FirehoseResult<CustomResourceDefinitionKind>;
  initialEditorType: EditorType;
  loaded: boolean;
  loadError?: any;
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  model: K8sKind;
};

export type CreateOperandPageProps = {
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  model: K8sKind;
};
