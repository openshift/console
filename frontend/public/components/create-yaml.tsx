import * as React from 'react';
import { match as RouterMatch } from 'react-router-dom';
import * as _ from 'lodash-es';

import { safeLoad } from 'js-yaml';
import { TEMPLATES } from '../yaml-templates';
import { connectToPlural } from '../kinds';
import { AsyncComponent } from './utils/async';
import { LoadingBox, firehoseFor } from './utils';
import { K8sKind, apiVersionForModel } from '../module/k8s';
import { ErrorPage404 } from './error';
import { ClusterServiceVersionModel } from '../models';

export const CreateYAML = connectToPlural((props: CreateYAMLProps) => {
  const {match, kindsInFlight, kindObj} = props;
  const {params} = match;

  if (!kindObj) {
    if (kindsInFlight) {
      return <LoadingBox />;
    }
    return <ErrorPage404 />;
  }

  const namespace = params.ns || 'default';
  const kindStr = `${apiVersionForModel(kindObj)}.${kindObj.kind}`;
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
    const apiGroup = kindObj.apiGroup ? `${kindObj.apiGroup}/` : '';
    obj.apiVersion = `${apiGroup}${kindObj.apiVersion}`;
    obj.spec = obj.spec || {};
  }

  // TODO: if someone edits namespace, we'll redirect to old namespace
  const redirectURL = params.appName ? `/k8s/ns/${namespace}/${ClusterServiceVersionModel.plural}/${params.appName}/instances` : null;

  return <AsyncComponent loader={() => import('./edit-yaml').then(c => c.EditYAML)} obj={obj} create={true} kind={kindObj.kind} redirectURL={redirectURL} showHeader={true} />;
});

export const EditYAMLPage: React.SFC<EditYAMLPageProps> = (props) => {
  const Wrapper = (wrapperProps) => <AsyncComponent {...wrapperProps} obj={wrapperProps.obj.data} loader={() => import('./edit-yaml').then(c => c.EditYAML)} create={false} showHeader={true} />;
  const EditYAMLPageFirehose = firehoseFor({
    obj: {kind: props.kind, name: props.match.params.name, namespace: props.match.params.ns, isList: false},
  });
  EditYAMLPageFirehose.displayName = 'EditYAMLPageFirehose';

  return <EditYAMLPageFirehose render={({obj}) =>
    <Wrapper obj={obj} />
  } />;
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
