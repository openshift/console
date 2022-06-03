import * as React from 'react';
import {
  Text,
  TextInputTypes,
  FormGroup,
  ClipboardCopy,
  InputGroup,
  ExpandableSection,
  TextVariants,
  Button,
} from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { Base64 } from 'js-base64';
import { Trans, useTranslation } from 'react-i18next';
import { generateSecret } from '@console/dev-console/src/components/import/import-submit-utils';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { GitProvider } from '@console/git-service/src';
import { ExternalLink, FirehoseResource } from '@console/internal/components/utils';
import { SecretModel } from '@console/internal/models';
import { ConfigMapKind } from '@console/internal/module/k8s/types';
import {
  RadioGroupField,
  InputField,
  ResourceDropdownField,
  useActiveNamespace,
} from '@console/shared/src';
import { AccessTokenDocLinks, WebhookDocLinks } from '../consts';
import PermissionsSection from './PermissionsSection';

type WebhoookSectionProps = {
  pac: ConfigMapKind;
};

const WebhookSection: React.FC<WebhoookSectionProps> = ({ pac }) => {
  const [namespace] = useActiveNamespace();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const [controllerUrl, setControllerUrl] = React.useState('');
  const [webhookSecret, setWebhookSecret] = React.useState('');
  const { t } = useTranslation();

  React.useEffect(() => {
    const ctlUrl = pac?.data?.['controller-url'];
    if (ctlUrl) {
      setControllerUrl(ctlUrl);
      setFieldValue('webhook.url', ctlUrl);
    }
  }, [pac, setFieldValue]);
  const autocompleteFilter = (text: string, item: any): boolean => fuzzy(text, item?.props?.name);
  const resources: FirehoseResource[] = [
    {
      isList: true,
      kind: SecretModel.kind,
      prop: SecretModel.id,
      namespace,
    },
  ];

  const generateWebhookSecret = () => {
    setWebhookSecret(generateSecret());
  };

  const getPermssionSectionHeading = (git: GitProvider) => {
    switch (git) {
      case GitProvider.GITHUB:
        return t('pipelines-plugin~See GitHub permissions');
      case GitProvider.GITLAB:
        return t('pipelines-plugin~See Gitlab permissions');
      case GitProvider.BITBUCKET:
        return t('pipelines-plugin~See BitBucket permissions');
      default:
        return t('pipelines-plugin~See Git permissions');
    }
  };

  const HelpText = (): React.ReactElement => {
    let helpText: React.ReactNode;
    switch (values.gitProvider) {
      case GitProvider.GITHUB:
        helpText = (
          <Trans t={t} ns="pipelines-plugin">
            Use your GitHub Personal token. Use this{' '}
            <a
              href={AccessTokenDocLinks[GitProvider.GITHUB]}
              target="_blank"
              rel="noopener noreferrer"
            >
              link
            </a>{' '}
            to create a token with repo, public_repo & admin:repo_hook scopes and give your token an
            expiration, i.e 30d.
          </Trans>
        );
        break;

      case GitProvider.GITLAB:
        helpText = (
          <Trans t={t} ns="pipelines-plugin">
            use your Gitlab Personal access token. Use this{' '}
            <a
              href={AccessTokenDocLinks[GitProvider.GITLAB]}
              target="_blank"
              rel="noopener noreferrer"
            >
              link
            </a>{' '}
            to create a token with api scope and give your token an expiration i.e 30d.
          </Trans>
        );
        break;

      case GitProvider.BITBUCKET:
        helpText = (
          <Trans t={t} ns="pipelines-plugin">
            use your Bitbucket App password. Use this{' '}
            <a
              href={AccessTokenDocLinks[GitProvider.BITBUCKET]}
              target="_blank"
              rel="noopener noreferrer"
            >
              link
            </a>{' '}
            to create a token with Read and Write scopes in Account, Workspace membership, Projects,
            Issues, Pull requests and give your token an expiration i.e 30d.
          </Trans>
        );
        break;

      default:
        helpText = (
          <Trans t={t} ns="pipelines-plugin">
            Use your Git Personal token. Create a token with repo, public_repo & admin:repo_hook
            scopes and give your token an expiration, i.e 30d.
          </Trans>
        );
    }

    return <div data-test={`${values.gitProvider}-helptext`}>{helpText}</div>;
  };

  return (
    <FormSection fullWidth extraMargin>
      <RadioGroupField
        name="webhook.method"
        label={t('pipelines-plugin~Secret')}
        options={[
          {
            value: 'token',
            label: t('pipelines-plugin~Git access token'),
            activeChildren: (
              <InputField
                name="webhook.token"
                type={TextInputTypes.text}
                helpText={<HelpText />}
                required
              />
            ),
          },
          {
            value: 'secret',
            label: t('pipelines-plugin~Git access token secret'),

            activeChildren: (
              <ResourceDropdownField
                helpText={t(
                  'pipelines-plugin~Secret with the Git access token for pulling pipeline and tasks from your Git repository.',
                )}
                name="webhook.secretRef"
                resources={resources}
                dataSelector={['metadata', 'name']}
                placeholder={t('pipelines-plugin~Select a secret')}
                autocompleteFilter={autocompleteFilter}
                fullWidth
                showBadge
                onChange={(k, v, res) => {
                  if (res && res.data) {
                    setFieldValue('webhook.secretObj', res);
                    const secret = res?.data['webhook.secret'];
                    if (secret) {
                      setWebhookSecret(Base64.decode(secret));
                    }
                  }
                }}
              />
            ),
          },
        ]}
      />
      {values.webhook.url && (
        <FormGroup
          fieldId="test"
          label={t('pipelines-plugin~Webhook URL')}
          helperText={t(
            'pipelines-plugin~We have detected a URL that can be used to configure the webhook.',
          )}
        >
          <ClipboardCopy
            isReadOnly
            name="webhook.url"
            hoverTip="Copy"
            clickTip="Copied"
            style={{ flex: '1' }}
          >
            {controllerUrl}
          </ClipboardCopy>
        </FormGroup>
      )}

      <FormGroup fieldId={'webhook-secret-clipboard'} label={t('pipelines-plugin~Webhook secret')}>
        <InputGroup style={{ display: 'flex' }}>
          <ClipboardCopy
            name="webhook.secret"
            hoverTip="Copy"
            clickTip="Copied"
            style={{ flex: '1' }}
            onChange={(v) => {
              setFieldValue('webhook.secret', v);
            }}
          >
            {webhookSecret}
          </ClipboardCopy>
          <Button data-test="generate-secret" variant="control" onClick={generateWebhookSecret}>
            {t('pipelines-plugin~Generate')}
          </Button>
        </InputGroup>
      </FormGroup>

      <ExpandableSection toggleText={getPermssionSectionHeading(values.gitProvider)}>
        <FormGroup label={t('pipelines-plugin~Repository Permissions:')} fieldId="repo-permissions">
          <Text component={TextVariants.small}>
            <PermissionsSection />
          </Text>
        </FormGroup>
      </ExpandableSection>

      <ExternalLink
        text={t('pipelines-plugin~Read more about setting up webhook')}
        href={WebhookDocLinks[values.gitProvider]}
      />
    </FormSection>
  );
};

export default WebhookSection;
