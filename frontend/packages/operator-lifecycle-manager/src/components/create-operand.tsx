import { safeDump, safeLoad } from 'js-yaml';
import { Button } from '@patternfly/react-core';
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
import { ClusterServiceVersionKind, CRDDescription, APIServiceDefinition } from '../types';
import { CreateOperandForm, OperandField } from './create-operand-form';
import { providedAPIsFor, referenceForProvidedAPI } from '.';

/**
 * Component which wraps the YAML editor to ensure the templates are added from the `ClusterServiceVersion` annotations.
 */
export const CreateOperandYAML: React.FC<CreateOperandYAMLProps> = ({
  buffer,
  clusterServiceVersion,
  match,
  operandModel,
  onToggleEditMethod = _.noop,
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
    `${resourcePathFromModel(ClusterServiceVersionModel, match.params.appName, match.params.ns)}/${
      match.params.plural
    }`;

  const onSwitchToForm = React.useCallback(() => {
    onToggleEditMethod(parsedYAML);
  }, [onToggleEditMethod, parsedYAML]);

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
          <div style={{ marginLeft: 'auto' }}>
            <Button variant="link" onClick={onSwitchToForm}>
              Edit Form
            </Button>
          </div>
        </div>
        <h1 className="co-create-operand__header-text">{`Create ${operandModel.label}`}</h1>
        <p className="help-block">
          Create by manually entering YAML or JSON definitions, or by dragging and dropping a file
          into the editor.
        </p>
      </div>
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
}) => {
  const { data: csv } = clusterServiceVersion;
  const csvAnnotations = _.get(csv, 'metadata.annotations', {});
  const operandModelReference = referenceForModel(operandModel);
  const [method, setMethod] = React.useState<'yaml' | 'form'>('yaml');
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
    setMethod((currentMethod) => (currentMethod === 'yaml' ? 'form' : 'yaml'));
  }, []);

  const editor = React.useMemo(() => {
    if (!loaded) {
      return null;
    }
    return method === 'yaml' ? (
      <CreateOperandYAML
        match={match}
        buffer={buffer || defaultSample}
        operandModel={operandModel}
        providedAPI={providedAPI}
        clusterServiceVersion={clusterServiceVersion.data}
        onToggleEditMethod={onToggleEditMethod}
      />
    ) : (
      <CreateOperandForm
        namespace={match.params.ns}
        operandModel={operandModel}
        providedAPI={providedAPI}
        buffer={buffer || defaultSample}
        clusterServiceVersion={clusterServiceVersion.data}
        openAPI={openAPI}
        onToggleEditMethod={onToggleEditMethod}
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
  ]);

  return (
    <StatusBox loaded={loaded} loadError={loadError} data={clusterServiceVersion}>
      {editor}
    </StatusBox>
  );
};

const stateToProps = ({ k8s }: RootState, props: Omit<CreateOperandPageProps, 'operandModel'>) => ({
  operandModel: k8s.getIn(['RESOURCES', 'models', props.match.params.plural]) as K8sKind,
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

type ProvidedAPI = CRDDescription | APIServiceDefinition;

export type CreateOperandProps = {
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  operandModel: K8sKind;
  loaded: boolean;
  loadError?: any;
  clusterServiceVersion: FirehoseResult<ClusterServiceVersionKind>;
  customResourceDefinition?: FirehoseResult<CustomResourceDefinitionKind>;
};

export type CreateOperandFormProps = {
  onToggleEditMethod?: (newBuffer?: K8sResourceKind) => void;
  operandModel: K8sKind;
  providedAPI: ProvidedAPI;
  openAPI?: SwaggerDefinition;
  clusterServiceVersion: ClusterServiceVersionKind;
  buffer?: K8sResourceKind;
  namespace: string;
};

export type CreateOperandYAMLProps = {
  onToggleEditMethod?: (newBuffer?: K8sResourceKind) => void;
  operandModel: K8sKind;
  providedAPI: ProvidedAPI;
  clusterServiceVersion: ClusterServiceVersionKind;
  buffer?: K8sResourceKind;
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
};

export type CreateOperandPageProps = {
  match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  operandModel: K8sKind;
};

export type SpecDescriptorInputProps = {
  field: OperandField;
  sample?: K8sResourceKind;
};
