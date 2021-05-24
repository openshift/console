import * as React from 'react';
import { match as RouterMatch } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import {
  YAMLTemplate,
  isYAMLTemplate,
} from '@console/dynamic-plugin-sdk/src/extensions/yaml-templates';
import { getYAMLTemplates } from '../models/yaml-templates';
import { connectToPlural } from '../kinds';
import { AsyncComponent } from './utils/async';
import { Firehose, LoadingBox } from './utils';
import {
  K8sKind,
  apiVersionForModel,
  referenceForModel,
  K8sResourceKindReference,
  K8sResourceKind,
} from '../module/k8s';
import { ErrorPage404 } from './error';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';

export const CreateYAML = connectToPlural((props: CreateYAMLProps) => {
  const {
    match,
    kindsInFlight,
    kindObj,
    hideHeader = false,
    onChange = () => null,
    resourceObjPath,
  } = props;
  const { params } = match;
  const { t } = useTranslation();
  const [templateExtensions, resolvedTemplates] = useResolvedExtensions<YAMLTemplate>(
    React.useCallback(
      (e): e is YAMLTemplate => isYAMLTemplate(e) && e.properties.model.kind === kindObj?.kind,
      [kindObj],
    ),
  );
  const yamlTemplates = React.useMemo(() => getYAMLTemplates(templateExtensions), [
    templateExtensions,
  ]);

  if (!kindObj) {
    if (kindsInFlight || !resolvedTemplates) {
      return <LoadingBox />;
    }
    return <ErrorPage404 />;
  }

  const namespace = params.ns || 'default';
  const template =
    props.template ||
    yamlTemplates.getIn([referenceForModel(kindObj), 'default']) ||
    yamlTemplates.getIn(['DEFAULT', 'default']);

  const obj = safeYAMLToJS(template);
  obj.kind = kindObj.kind;
  obj.metadata = obj.metadata || {};
  if (kindObj.namespaced) {
    obj.metadata.namespace = namespace;
  }
  if (kindObj.crd && template === yamlTemplates.getIn(['DEFAULT', 'default'])) {
    obj.apiVersion = apiVersionForModel(kindObj);
    obj.spec = obj.spec || {};
  }
  const header = t('public~Create {{objLabel}}', {
    objLabel: kindObj.labelKey ? t(kindObj.labelKey) : kindObj.label,
  });

  // TODO: if someone edits namespace, we'll redirect to old namespace

  return (
    <AsyncComponent
      loader={() => import('./droppable-edit-yaml').then((c) => c.DroppableEditYAML)}
      obj={obj}
      create={true}
      kind={kindObj.kind}
      header={header}
      hideHeader={hideHeader}
      resourceObjPath={resourceObjPath}
      onChange={onChange}
    />
  );
});

export const EditYAMLPage: React.SFC<EditYAMLPageProps> = (props) => {
  const Wrapper = (wrapperProps) => (
    <AsyncComponent
      {...wrapperProps}
      obj={wrapperProps.obj.data}
      loader={() => import('./edit-yaml').then((c) => c.EditYAML)}
      create={false}
    />
  );
  return (
    <Firehose
      resources={[
        {
          kind: props.kind,
          name: props.match.params.name,
          namespace: props.match.params.ns,
          isList: false,
          prop: 'obj',
        },
      ]}
    >
      <Wrapper />
    </Firehose>
  );
};

export type CreateYAMLProps = {
  match: RouterMatch<{ ns: string; plural: string; appName?: string }>;
  kindsInFlight: boolean;
  kindObj: K8sKind;
  template?: string;
  download?: boolean;
  header?: string;
  hideHeader?: boolean;
  resourceObjPath?: (obj: K8sResourceKind, kind: K8sResourceKindReference) => string;
  onChange?: (yaml: string) => any;
};

export type EditYAMLPageProps = {
  match: RouterMatch<{ ns: string; name: string }>;
  kind: string;
};

EditYAMLPage.displayName = 'EditYAMLPage';
