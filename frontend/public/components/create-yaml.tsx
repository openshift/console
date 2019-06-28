import * as React from 'react';
import { match as RouterMatch } from 'react-router-dom';

import { safeLoad } from 'js-yaml';
import { yamlTemplates } from '../models/yaml-templates';
import { connectToPlural } from '../kinds';
import { AsyncComponent } from './utils/async';
import { Firehose, LoadingBox } from './utils';
import { K8sKind, apiVersionForModel, referenceForModel } from '../module/k8s';
import { ErrorPage404 } from './error';
import { ClusterServiceVersionModel } from '../models';

export const CreateYAML = connectToPlural((props: CreateYAMLProps) => {
  const {match, kindsInFlight, kindObj, hideHeader = false} = props;
  const {params} = match;

  if (!kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    return <ErrorPage404 />;
  }

  const namespace = params.ns || 'default';
  const template = props.template || yamlTemplates.getIn([referenceForModel(kindObj), 'default']) || yamlTemplates.getIn(['DEFAULT', 'default']);

  const obj = safeLoad(template);
  obj.kind = kindObj.kind;
  obj.metadata = obj.metadata || {};
  if (kindObj.namespaced) {
    obj.metadata.namespace = namespace;
  }
  if (kindObj.crd && template === yamlTemplates.getIn(['DEFAULT', 'default'])) {
    obj.apiVersion = apiVersionForModel(kindObj);
    obj.spec = obj.spec || {};
  }
  const header = `Create ${kindObj.label}`;

  // TODO: if someone edits namespace, we'll redirect to old namespace
  const redirectURL = params.appName ? `/k8s/ns/${namespace}/${ClusterServiceVersionModel.plural}/${params.appName}/${referenceForModel(kindObj)}` : null;

  return <AsyncComponent loader={() => import('./droppable-edit-yaml').then(c => c.DroppableEditYAML)} obj={obj} create={true} kind={kindObj.kind} redirectURL={redirectURL} header={header} hideHeader={hideHeader} />;
});

export const EditYAMLPage: React.SFC<EditYAMLPageProps> = (props) => {
  const Wrapper = (wrapperProps) => <AsyncComponent {...wrapperProps} obj={wrapperProps.obj.data} loader={() => import('./edit-yaml').then(c => c.EditYAML)} create={false} />;
  return <Firehose resources={[{kind: props.kind, name: props.match.params.name, namespace: props.match.params.ns, isList: false, prop: 'obj'}]}>
    <Wrapper />
  </Firehose>;
};

export type CreateYAMLProps = {
  match: RouterMatch<{ns: string, plural: string, appName?: string}>;
  kindsInFlight: boolean;
  kindObj: K8sKind;
  template?: string;
  download?: boolean;
  header?: string;
  hideHeader?: boolean;
};

export type EditYAMLPageProps = {
  match: RouterMatch<{ns: string, name: string}>;
  kind: string;
};

EditYAMLPage.displayName = 'EditYAMLPage';
