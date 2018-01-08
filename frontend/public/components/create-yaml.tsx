import * as React from 'react';
import { match as RouterMatch } from 'react-router-dom';
import * as _ from 'lodash';

import { safeLoad } from 'js-yaml';
import { TEMPLATES } from '../yaml-templates';
import { connectToPlural } from '../kinds';
import { AsyncComponent } from './utils/async';
import { Firehose, LoadingBox } from './utils';
import { K8sKind } from '../module/k8s';
import { ErrorPage404 } from './error';

export const CreateYAML = connectToPlural((props: CreateYAMLProps) => {
  const {match, kindsInFlight, kindObj} = props;
  const {params} = match;

  if (!kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    return <ErrorPage404 />;
  }

  const apiVersion = kindObj.apiVersion || 'v1';
  const namespace = params.ns || 'default';
  const kindStr = `${apiVersion}.${kindObj.kind}`;
  let template = _.get(TEMPLATES, [kindStr, 'default']);
  if (!template) {
    // eslint-disable-next-line no-console
    console.warn(`No template found for ${kindStr}. Falling back to default template.`);
    template = TEMPLATES.DEFAULT.default;
  }

  const obj = safeLoad(template);
  obj.kind = kindObj.kind;
  obj.metadata = obj.metadata || {};
  if (kindObj.namespaced) {
    obj.metadata.namespace = namespace;
  }
  if (kindObj.crd && template === TEMPLATES.DEFAULT.default) {
    obj.apiVersion = kindObj.basePath.replace(/^\/apis\//, '') + kindObj.apiVersion;
    obj.spec = obj.spec || {};
  }

  // TODO: if someone edits namespace, we'll redirect to old namespace
  const redirectURL = params.appName ? `/ns/${params.ns}/clusterserviceversion-v1s/${params.appName}/instances` : null;

  return <AsyncComponent loader={() => import('./edit-yaml').then(c => c.EditYAML)} obj={obj} create={true} kind={kindObj.kind} redirectURL={redirectURL} showHeader={true} />;
});

export const EditYAMLPage: React.SFC<EditYAMLPageProps> = (props) => {
  const Wrapper = (wrapperProps) => <AsyncComponent {...wrapperProps} obj={wrapperProps.obj.data} loader={() => import('./edit-yaml').then(c => c.EditYAML)} create={false} showHeader={true} />;
  return <Firehose resources={[{kind: props.kind, name: props.match.params.name, namespace: props.match.params.ns, isList: false, prop: 'obj'}]}>
    <Wrapper />
  </Firehose>;
};

/* eslint-disable no-undef */
export type CreateYAMLProps = {
  match: RouterMatch<{ns: string, plural: string, appName?: string}>;
  kindsInFlight: boolean;
  kindObj: K8sKind;
};

export type EditYAMLPageProps = {
  match: RouterMatch<{ns: string, name: string}>;
  kind: string;
};
/* eslint-enable no-undef */

EditYAMLPage.displayName = 'EditYAMLPage';
