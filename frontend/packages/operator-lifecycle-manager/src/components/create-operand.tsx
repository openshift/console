import { safeDump, safeLoad } from 'js-yaml';
import {
  K8sKind,
  K8sResourceKind,
  K8sResourceKindReference,
  kindForReference,
  referenceFor,
  referenceForModel,
  nameForModel,
  CustomResourceDefinitionKind,
} from '@console/internal/module/k8s';
import { SwaggerDefinition, definitionFor } from '@console/internal/module/k8s/swagger';
import { CustomResourceDefinitionModel } from '@console/internal/models';
import { Firehose } from '@console/internal/components/utils/firehose';
import {
  StatusBox,
  BreadCrumbs,
  resourcePathFromModel,
  FirehoseResult,
} from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { CreateYAML } from '@console/internal/components/create-yaml';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { match as RouterMatch } from 'react-router';
import { connect } from 'react-redux';
import * as React from 'react';
import { ClusterServiceVersionModel } from '../models';
import { ClusterServiceVersionKind, ProvidedAPI } from '../types';
import { CreateOperandForm } from './create-operand-form';
import { providedAPIsFor, referenceForProvidedAPI } from '.';
import { getActivePerspective } from '@console/internal/reducers/ui';
import { EditorToggle, EditorType } from '@console/shared/src/components/editor/editor-toggle';

/**
 * Component which wraps the YAML editor to ensure the templates are added from the `ClusterServiceVersion` annotations.
 */
export const CreateOperandYAML: React.FC<CreateOperandYAMLProps> = ({
  buffer,
  clusterServiceVersion,
  match,
  operandModel,
  activePerspective,
  onChangeEditor = _.noop,
}) => {
  const template = React.useMemo(() => _.attempt(() => safeDump(buffer)), [buffer]);
  if (_.isError(template)) {
    // eslint-disable-next-line no-console
    console.error('Error parsing example JSON from annotation. Falling back to default.');
  }

  const [parsedYAML, setParsedYAML] = React.useState(buffer);

  const onYAMLChanged = (newYAML) => {
    const newParsedYAML = _.attempt(() => safeLoad(newYAML));
    setParsedYAML((currentParsedYAML) =>
      !_.isError(newParsedYAML) ? newParsedYAML : currentParsedYAML,
    );
  };

  const resourceObjPath = () =>
    activePerspective === 'dev'
      ? '/topology'
      : `${resourcePathFromModel(
          ClusterServiceVersionModel,
          match.params.appName,
          match.params.ns,
        )}/${match.params.plural}`;

  const onSwitchToForm = React.useCallback(() => {
    onChangeEditor(parsedYAML);
  }, [onChangeEditor, parsedYAML]);

  return (
    <>
      <div className="co-create-operand__header">
        <div className="co-create-operand__header-buttons">
          <BreadCrumbs
            breadcrumbs={[
              {
                name: clusterServiceVersion.spec.displayName,
                path: resourcePathFromModel(
                  ClusterServiceVersionModel,
                  clusterServiceVersion.metadata.name,
                  clusterServiceVersion.metadata.namespace,
                ),
              },
              { name: `Create ${operandModel.label}`, path: window.location.pathname },
            ]}
          />
        </div>
        <h1 className="co-create-operand__header-text">{`Create ${operandModel.label}`}</h1>
        <p className="help-block">
          Create by manually entering YAML or JSON definitions, or by dragging and dropping a file
          into the editor.
        </p>
      </div>
      <EditorToggle value={EditorType.YAML} onChange={onSwitchToForm} />
      <CreateYAML
        template={_.isError(template) ? null : template}
        match={match}
        resourceObjPath={resourceObjPath}
        hideHeader
        onChange={onYAMLChanged}
      />
    </>
  );
};

export const CreateOperand: React.FC<CreateOperandProps> = ({
  clusterServiceVersion,
  customResourceDefinition,
  loaded,
  loadError,
  match,
  operandModel,
  activePerspective,
}) => {
  const { data: csv } = clusterServiceVersion;
  const csvAnnotations = _.get(csv, 'metadata.annotations', {});
  const operandModelReference = referenceForModel(operandModel);
  const [method, setMethod] = React.useState<EditorType>(EditorType.Form);
  const providedAPI = React.useMemo<ProvidedAPI>(
    () =>
      providedAPIsFor(csv).find((crd) => referenceForProvidedAPI(crd) === operandModelReference),
    [csv, operandModelReference],
  );

  const openAPI = React.useMemo(
    () =>
      (_.get(customResourceDefinition, [
        'data',
        'spec',
        'validation',
        'openAPIV3Schema',
      ]) as SwaggerDefinition) || definitionFor(operandModel),
    [customResourceDefinition, operandModel],
  );

  const defaultSample = React.useMemo<K8sResourceKind>(
    () =>
      JSON.parse(_.get(csvAnnotations, 'alm-examples', '[]')).find(
        (s: K8sResourceKind) => referenceFor(s) === operandModelReference,
      ),
    [operandModelReference, csvAnnotations],
  );

  const [buffer, setBuffer] = React.useState<K8sResourceKind>();

  const onToggleEditMethod = React.useCallback((newBuffer) => {
    setBuffer(newBuffer);
    setMethod((currentMethod) =>
      currentMethod === EditorType.YAML ? EditorType.Form : EditorType.YAML,
    );
  }, []);

  const editor = React.useMemo(() => {
    if (!loaded) {
      return null;
    }
    return method === EditorType.YAML ? (
      <CreateOperandYAML
        activePerspective={activePerspective}
        match={match}
        buffer={buffer || defaultSample}
        operandModel={operandModel}
        providedAPI={providedAPI}
        clusterServiceVersion={clusterServiceVersion.data}
        onChangeEditor={onToggleEditMethod}
      />
    ) : (
      <CreateOperandForm
        activePerspective={activePerspective}
        namespace={match.params.ns}
        operandModel={operandModel}
        providedAPI={providedAPI}
        buffer={buffer || defaultSample}
        clusterServiceVersion={clusterServiceVersion.data}
        openAPI={openAPI}
        onChangeEditor={onToggleEditMethod}
      />
    );
  }, [
    buffer,
    clusterServiceVersion.data,
    defaultSample,
    loaded,
    match,
    method,
    onToggleEditMethod,
    openAPI,
    operandModel,
    providedAPI,
    activePerspective,
  ]);

  return (
    <StatusBox loaded={loaded} loadError={loadError} data={clusterServiceVersion}>
      {editor}
    </StatusBox>
  );
};

const stateToProps = (state: RootState, props: Omit<CreateOperandPageProps, 'operandModel'>) => ({
  operandModel: state.k8s.getIn(['RESOURCES', 'models', props.match.params.plural]) as K8sKind,
  activePerspective: getActivePerspective(state),
});

export const CreateOperandPage = connect(stateToProps)((props: CreateOperandPageProps) => (
  <>
    <Helmet>
      <title>{`Create ${kindForReference(props.match.params.plural)}`}</title>
    </Helmet>
    {props.operandModel && (
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
            name: nameForModel(props.operandModel),
            prop: 'customResourceDefinition',
            optional: true,
          },
        ]}
      >
        {/* FIXME(alecmerdler): Hack because `Firehose` injects props without TypeScript knowing about it */}
        <CreateOperand {...(props as any)} operandModel={props.operandModel} match={props.match} />
      </Firehose>
    )}
  </>
));

export type CreateOperandProps = {
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  operandModel: K8sKind;
  loaded: boolean;
  loadError?: any;
  clusterServiceVersion: FirehoseResult<ClusterServiceVersionKind>;
  customResourceDefinition?: FirehoseResult<CustomResourceDefinitionKind>;
  activePerspective: string;
};

export type CreateOperandYAMLProps = {
  onChangeEditor?: (newBuffer?: K8sResourceKind) => void;
  operandModel: K8sKind;
  providedAPI: ProvidedAPI;
  clusterServiceVersion: ClusterServiceVersionKind;
  buffer?: K8sResourceKind;
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  activePerspective: string;
};

export type CreateOperandPageProps = {
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  operandModel: K8sKind;
};
