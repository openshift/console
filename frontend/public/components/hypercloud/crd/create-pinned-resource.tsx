import * as _ from 'lodash';
import * as React from 'react';
import { JSONSchema6 } from 'json-schema';
import { K8sKind, modelFor, K8sResourceKind, K8sResourceKindReference, kindForReference, nameForModel, CustomResourceDefinitionKind, definitionFor, referenceForModel } from '@console/internal/module/k8s';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import { Firehose } from '@console/internal/components/utils/firehose';
import { StatusBox, FirehoseResult, BreadCrumbs, resourcePathFromModel } from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { SyncedEditor } from '@console/shared/src/components/synced-editor';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { connect } from 'react-redux';
import { exampleForModel } from '.';
import { Helmet } from 'react-helmet';
import { match as RouterMatch } from 'react-router';
import { OperandForm } from '@console/operator-lifecycle-manager/src/components/operand/operand-form';
import { OperandYAML } from '@console/operator-lifecycle-manager/src/components/operand/operand-yaml';
import { FORM_HELP_TEXT, YAML_HELP_TEXT, DEFAULT_K8S_SCHEMA } from '@console/operator-lifecycle-manager/src/components/operand/const';
import { prune } from '@console/shared/src/components/dynamic-form/utils';
import { schemaTemplates } from '../../../models/hypercloud/structural-schema-template';
import { pluralToKind } from '../form';
// eslint-disable-next-line @typescript-eslint/camelcase

export const CreateDefault: React.FC<CreateDefaultProps> = ({ customResourceDefinition, initialEditorType, loaded, loadError, match, model, activePerspective }) => {
  const template = schemaTemplates.getIn([referenceForModel(model), 'default']);
  const data = {
    spec: {
      version: '',
      group: '',
      names: {
        kind: '',
        singular: '',
        plural: '',
        listKind: '',
      },
    },
  };
  const [helpText, setHelpText] = React.useState(FORM_HELP_TEXT);
  const next = `${resourcePathFromModel(CustomResourceDefinitionModel, match.params.appName, match.params.ns)}/${model.plural}.${model.apiGroup}`;
  let definition;

  if (customResourceDefinition) {
    definition = customResourceDefinition.data;
  }

  const [schema, FormComponent] = React.useMemo(() => {
    const baseSchema = customResourceDefinition ? definition?.spec?.validation?.openAPIV3Schema ?? (definitionFor(model) as JSONSchema6) : template;
    return [_.defaultsDeep({}, DEFAULT_K8S_SCHEMA, _.omit(baseSchema, 'properties.status')), OperandForm];
  }, [definition, model]);

  const sample = React.useMemo<K8sResourceKind>(() => exampleForModel(definition, model), [definition, model]);

  const pruneFunc = React.useCallback(data => prune(data, sample), [sample]);

  const onChangeEditorType = React.useCallback(newMethod => {
    setHelpText(newMethod === EditorType.Form ? FORM_HELP_TEXT : YAML_HELP_TEXT);
  }, []);

  return (
    <StatusBox loaded={loaded} loadError={loadError} data={customResourceDefinition || data}>
      {loaded || !customResourceDefinition ? (
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

const stateToProps = (state: RootState, props) => ({ model: modelFor(pluralToKind.get(props.match.params.plural)['kind']) as K8sKind, activePerspective: getActivePerspective(state) });

export const CreateDefaultPage = connect(stateToProps)((props: CreateDefaultPageProps) => {
  const type = pluralToKind.get(props.match.params.plural)['type'];
  const resources =
    type === 'CustomResourceDefinition'
      ? [
          {
            kind: CustomResourceDefinitionModel.kind,
            isList: false,
            name: nameForModel(props.model),
            prop: 'customResourceDefinition',
            optional: true,
          },
        ]
      : [];
  return (
    <>
      <Helmet>
        <title>{`Create ${kindForReference(props.match.params.plural)}`}</title>
      </Helmet>
      <Firehose resources={resources}>
        {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
        <CreateDefault {...(props as any)} model={props.model} match={props.match} initialEditorType={EditorType.Form} />
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
