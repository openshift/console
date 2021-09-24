import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { match as RouterMatch } from 'react-router';
import { CreateYAML } from '@console/internal/components/create-yaml';
import { PageHeading } from '@console/internal/components/utils';
import { NetworkPolicyModel } from '@console/internal/models';
import { K8sResourceKindReference, NetworkPolicyKind } from '@console/internal/module/k8s';
import { SyncedEditor } from '@console/shared/src/components/synced-editor';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { NetworkPolicyForm } from './network-policy-form';
import {
  isNetworkPolicyConversionError,
  NetworkPolicy,
  networkPolicyFromK8sResource,
  networkPolicyNormalizeK8sResource,
  networkPolicyToK8sResource,
} from './network-policy-model';

import './_create-network-policy.scss';

const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'console.createNetworkPolicy.editor.lastView';

export const CreateNetworkPolicy: React.FC<{
  match: RouterMatch<{ ns: string }>;
}> = (props) => {
  const { t } = useTranslation();
  const params = { ...props.match.params, plural: NetworkPolicyModel.plural };
  const initialPolicy: NetworkPolicy = {
    name: '',
    namespace: params.ns,
    podSelector: [['', '']],
    ingress: {
      denyAll: false,
      rules: [],
    },
    egress: {
      denyAll: false,
      rules: [],
    },
  };

  const formHelpText = t('console-app~Create by completing the form.');
  const yamlHelpText = t(
    'console-app~Create by manually entering YAML or JSON definitions, or by dragging and dropping a file into the editor.',
  );

  const [helpText, setHelpText] = React.useState(formHelpText);

  const k8sObj = networkPolicyToK8sResource(initialPolicy);

  const YAMLEditor: React.FC<YAMLEditorProps> = ({ onChange, initialYAML = '' }) => {
    return (
      <CreateYAML hideHeader match={{ params } as any} onChange={onChange} template={initialYAML} />
    );
  };

  const checkPolicyValidForForm = (obj: NetworkPolicyKind) => {
    const normalizedK8S = networkPolicyNormalizeK8sResource(obj);
    const converted = networkPolicyFromK8sResource(normalizedK8S, t);
    if (isNetworkPolicyConversionError(converted)) {
      throw converted.error;
    } else {
      // Convert back to check for unsupported fields (check isomorphism)
      const reconverted = networkPolicyToK8sResource(converted);
      if (!_.isEqual(normalizedK8S, reconverted)) {
        throw new Error(
          t(
            'console-app~Not all YAML property values are supported in the form editor. Some data would be lost.',
          ),
        );
      }
    }
  };

  type YAMLEditorProps = {
    initialYAML?: string;
    onChange?: (yaml: string) => void;
    match: RouterMatch<{ appName: string; ns: string; plural: K8sResourceKindReference }>;
  };

  return (
    <>
      <PageHeading
        className="create-network-policy__page-heading"
        title={t('console-app~Create NetworkPolicy')}
      >
        <span className="help-block">{helpText}</span>
      </PageHeading>
      <SyncedEditor
        context={{
          formContext: { networkPolicy: initialPolicy },
          yamlContext: {},
        }}
        FormEditor={NetworkPolicyForm}
        initialData={k8sObj}
        initialType={EditorType.Form}
        onChangeEditorType={(type) =>
          setHelpText(type === EditorType.Form ? formHelpText : yamlHelpText)
        }
        onChange={checkPolicyValidForForm}
        YAMLEditor={YAMLEditor}
        lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
        displayConversionError
      />
    </>
  );
};
