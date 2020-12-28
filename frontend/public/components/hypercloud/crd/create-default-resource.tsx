import * as _ from 'lodash';
import * as React from 'react';
import { JSONSchema6 } from 'json-schema';
import { K8sKind, modelFor, K8sResourceKind, K8sResourceKindReference, kindForReference, nameForModel, CustomResourceDefinitionKind, definitionFor } from '@console/internal/module/k8s';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import { Firehose } from '@console/internal/components/utils/firehose';
import { StatusBox, FirehoseResult, BreadCrumbs, resourcePathFromModel } from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { SyncedEditor } from '@console/shared/src/components/synced-editor';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { connect } from 'react-redux';
import { exampleForModel } from './';
import { Helmet } from 'react-helmet';
import { match as RouterMatch } from 'react-router';
import { OperandForm } from '@console/operator-lifecycle-manager/src/components/operand/operand-form';
import { OperandYAML } from '@console/operator-lifecycle-manager/src/components/operand/operand-yaml';
import { FORM_HELP_TEXT, YAML_HELP_TEXT, DEFAULT_K8S_SCHEMA } from '@console/operator-lifecycle-manager/src/components/operand/const';
import { prune } from '@console/shared/src/components/dynamic-form/utils';
import { pluralToKind } from '../form';
// eslint-disable-next-line @typescript-eslint/camelcase

export const CreateDefault: React.FC<CreateDefaultProps> = ({ customResourceDefinition, initialEditorType, loaded, loadError, match, model, activePerspective }) => {
  const { data: crd } = customResourceDefinition;
  const [helpText, setHelpText] = React.useState(FORM_HELP_TEXT);
  const next = `${resourcePathFromModel(CustomResourceDefinitionModel, match.params.appName, match.params.ns)}/${model.plural}.${model.apiGroup}`;

  const [schema, FormComponent] = React.useMemo(() => {
    const baseSchema = crd?.spec?.validation?.openAPIV3Schema ?? (definitionFor(model) as JSONSchema6);
    return [_.defaultsDeep({}, DEFAULT_K8S_SCHEMA, _.omit(baseSchema, 'properties.status')), OperandForm];
  }, [crd, model]);

  const sample = React.useMemo<K8sResourceKind>(() => exampleForModel(crd, model), [crd, model]);

  const pruneFunc = React.useCallback(data => prune(data, sample), [sample]);

  const onChangeEditorType = React.useCallback(newMethod => {
    setHelpText(newMethod === EditorType.Form ? FORM_HELP_TEXT : YAML_HELP_TEXT);
  }, []);

  return (
    <StatusBox loaded={loaded} loadError={loadError} data={customResourceDefinition}>
      {loaded ? (
        <>
          <div className="co-create-operand__header">
            <div className="co-create-operand__header-buttons">
              <BreadCrumbs breadcrumbs={[{ name: `Create ${model.label}`, path: window.location.pathname }]} />
            </div>
            <h1 className="co-create-operand__header-text">{`Create ${model.label}`}</h1>
            <p className="help-block">{helpText}</p>
          </div>
          <SyncedEditor
            context={{
              formContext: { match, model, next, schema },
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

const stateToProps = (state: RootState) => ({
  activePerspective: getActivePerspective(state),
});

export const CreateDefaultPage = connect(stateToProps)((props: CreateDefaultPageProps) => {
  let model = modelFor(pluralToKind.get(props.match.params.plural)['kind']);
  return (
    <>
      <Helmet>
        <title>{`Create ${kindForReference(props.match.params.plural)}`}</title>
      </Helmet>
      <Firehose
        resources={[
          {
            kind: CustomResourceDefinitionModel.kind,
            isList: false,
            name: nameForModel(model),
            prop: 'customResourceDefinition',
            optional: true,
          },
        ]}
      >
        {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
        <CreateDefault {...(props as any)} model={model} match={props.match} initialEditorType={EditorType.Form} />
      </Firehose>
    </>
  );
});

export type CreateDefaultProps = {
  activePerspective: string;
  customResourceDefinition?: FirehoseResult<CustomResourceDefinitionKind>;
  initialEditorType: EditorType;
  loaded: boolean;
  loadError?: any;
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  model: K8sKind;
};

export type CreateDefaultPageProps = {
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  model: K8sKind;
};
