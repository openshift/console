import * as React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { useTranslation } from 'react-i18next';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import {
  YAMLTemplate,
  isYAMLTemplate,
} from '@console/dynamic-plugin-sdk/src/extensions/yaml-templates';
import { getYAMLTemplates } from '../models/yaml-templates';
import { connectToPlural } from '../kinds';
import { AsyncComponent } from './utils/async';
import { Firehose } from './utils/firehose';
import { LoadingBox } from './utils/status-box';
import {
  K8sKind,
  apiVersionForModel,
  referenceForModel,
  K8sResourceKindReference,
  K8sResourceKind,
} from '../module/k8s';
import { ErrorPage404 } from './error';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';

export const CreateYAMLInner = ({
  params,
  kindsInFlight,
  kindObj,
  hideHeader = false,
  onChange = () => null,
  resourceObjPath,
  isCreate = true,
  template,
}: CreateYAMLProps) => {
  const { t } = useTranslation();
  const namespace = params.ns || 'default';
  const [templateExtensions, resolvedTemplates] = useResolvedExtensions<YAMLTemplate>(
    React.useCallback(
      (e): e is YAMLTemplate => isYAMLTemplate(e) && e.properties.model.kind === kindObj?.kind,
      [kindObj],
    ),
  );

  const yamlTemplates = React.useMemo(() => getYAMLTemplates(templateExtensions), [
    templateExtensions,
  ]);

  const initialResource = React.useMemo(() => {
    if (!kindObj) {
      return {};
    }
    const resolvedTemplate =
      template ||
      yamlTemplates.getIn([referenceForModel(kindObj), 'default']) ||
      yamlTemplates.getIn(['DEFAULT', 'default']);
    if (!resolvedTemplate) {
      return {};
    }

    const parsed = safeYAMLToJS(resolvedTemplate);
    if (!parsed || typeof parsed === 'string') {
      return {};
    }

    const { metadata, spec } = parsed;
    const { crd, kind, namespaced } = kindObj;
    const isDefaultTemplate =
      crd && resolvedTemplate === yamlTemplates.getIn(['DEFAULT', 'default']);
    return {
      ...parsed,
      kind,
      metadata: {
        ...(metadata ?? {}),
        ...(namespaced ? { namespace } : {}),
      },
      ...(isDefaultTemplate
        ? {
            apiVersion: apiVersionForModel(kindObj),
            spec: spec ?? {},
          }
        : {}),
    };
  }, [template, kindObj, namespace, yamlTemplates]);

  if (!kindObj) {
    if (kindsInFlight || !resolvedTemplates) {
      return <LoadingBox />;
    }
    return <ErrorPage404 />;
  }
  const header = isCreate
    ? t('public~Create {{objLabel}}', {
        objLabel: kindObj.labelKey ? t(kindObj.labelKey) : kindObj.label,
      })
    : t('public~Edit {{objLabel}}', {
        objLabel: kindObj.labelKey ? t(kindObj.labelKey) : kindObj.label,
      });

  // TODO: if someone edits namespace, we'll redirect to old namespace

  return (
    <AsyncComponent
      blame="CreateYaml"
      loader={() => import('./droppable-edit-yaml').then((c) => c.DroppableEditYAML)}
      initialResource={initialResource}
      create={isCreate}
      header={header}
      hideHeader={hideHeader}
      resourceObjPath={resourceObjPath}
      onChange={onChange}
    />
  );
};

const CreateYAML_ = connectToPlural(CreateYAMLInner);

export const CreateYAML = (props) => {
  const params = useParams();
  return <CreateYAML_ {...props} params={params} />;
};

export const EditYAMLPage: React.FCC<EditYAMLPageProps> = (props) => {
  const params = useParams();
  const Wrapper = (wrapperProps) => (
    <AsyncComponent
      blame="EditYamlPage"
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
          name: params.name,
          namespace: params.ns,
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
  match?: any;
  params?: any;
  kindsInFlight: boolean;
  kindObj: K8sKind;
  template?: string;
  download?: boolean;
  header?: string;
  hideHeader?: boolean;
  isCreate?: boolean;
  resourceObjPath?: (obj: K8sResourceKind, kind: K8sResourceKindReference) => string;
  onChange?: (yaml: string) => any;
};

export type EditYAMLPageProps = {
  kind: string;
};

CreateYAML.displayName = 'CreateYAML';
EditYAMLPage.displayName = 'EditYAMLPage';
