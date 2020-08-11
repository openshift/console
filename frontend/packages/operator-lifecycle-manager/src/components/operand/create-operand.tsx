import * as _ from 'lodash';
import * as React from 'react';
import { JSONSchema6 } from 'json-schema';
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
import { CustomResourceDefinitionModel } from '@console/internal/models';
import {
  PageHeading,
  StatusBox,
  FirehoseResult,
  BreadCrumbs,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import { Firehose } from '@console/internal/components/utils/firehose';
import { RootState } from '@console/internal/redux';
import { SyncedEditor } from '@console/shared/src/components/synced-editor';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { getBadgeFromType } from '@console/shared/src/components/badges';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { match as RouterMatch } from 'react-router';
import { ClusterServiceVersionModel } from '../../models';
import { ClusterServiceVersionKind, ProvidedAPI } from '../../types';
import { OperandForm } from './operand-form';
import { OperandYAML } from './operand-yaml';
import { exampleForModel, providedAPIForModel } from '..';
import { FORM_HELP_TEXT, YAML_HELP_TEXT, DEFAULT_K8S_SCHEMA } from './const';
import { getSchemaErrors, prune } from '@console/shared/src/components/dynamic-form/utils';
import { hasNoFields } from './utils';
// eslint-disable-next-line @typescript-eslint/camelcase
import { DEPRECATED_CreateOperandForm } from './DEPRECATED_operand-form';

import './create-operand.scss';

export const CreateOperand: React.FC<CreateOperandProps> = ({
  clusterServiceVersion,
  customResourceDefinition,
  initialEditorType,
  loaded,
  loadError,
  match,
  model,
  activePerspective,
}) => {
  const { data: csv } = clusterServiceVersion;
  const { data: crd } = customResourceDefinition;
  const [helpText, setHelpText] = React.useState(FORM_HELP_TEXT);
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

  // TODO This logic should be removed in 4.6 and we should only be using
  // the OperandForm component. We are providing a temporary fallback
  // to the old form component to ease the transition to structural schemas
  // over descriptors. In 4.6, structural schemas will be required, and
  // the fallback will no longer be necessary/provided. If no structural schema
  // is provided in 4.6, a form will not be generated.
  const [schema, FormComponent] = React.useMemo(() => {
    const baseSchema =
      crd?.spec?.validation?.openAPIV3Schema ?? (definitionFor(model) as JSONSchema6);
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
  }, [crd, model]);

  const sample = React.useMemo<K8sResourceKind>(() => exampleForModel(csv, model), [csv, model]);

  const pruneFunc = React.useCallback((data) => prune(data, sample), [sample]);

  const onChangeEditorType = React.useCallback((newMethod) => {
    setHelpText(newMethod === EditorType.Form ? FORM_HELP_TEXT : YAML_HELP_TEXT);
  }, []);

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
                  { name: `Create ${model.label}`, path: window.location.pathname },
                ]}
              />
            </div>
            <PageHeading
              badge={getBadgeFromType(model.badge)}
              className="olm-create-operand__page-heading"
              title={`Create ${model.label}`}
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
  activePerspective: getActivePerspective(state),
});

export const CreateOperandPage = connect(stateToProps)((props: CreateOperandPageProps) => (
  <>
    <Helmet>
      <title>{`Create ${kindForReference(props.match.params.plural)}`}</title>
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
));

export type CreateOperandProps = {
  activePerspective: string;
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
