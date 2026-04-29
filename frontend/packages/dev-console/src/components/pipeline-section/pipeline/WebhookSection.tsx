import type { FC, ReactNode, ReactElement } from 'react';
import { useState, useEffect, useMemo } from 'react';
import {
  Content,
  TextInputTypes,
  FormGroup,
  ClipboardCopy,
  InputGroup,
  ExpandableSection,
  ContentVariants,
  Button,
  Tooltip,
  InputGroupItem,
  FormHelperText,
  HelperText,
  HelperTextItem,
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { Base64 } from 'js-base64';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { generateSecret } from '@console/dev-console/src/components/import/import-submit-utils';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { GitProvider } from '@console/git-service/src/types/git';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { SecretModel } from '@console/internal/models';
import type { ConfigMapKind, SecretKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { RadioGroupField, InputField, ResourceDropdownField } from '@console/shared/src';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import PermissionsSection from './PermissionsSection';

type WebhoookSectionProps = {
  pac: ConfigMapKind;
  formContextField?: string;
};

export const AccessTokenDocLinks = {
  [GitProvider.GITHUB]:
    'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
  [GitProvider.GITLAB]: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html',
  [GitProvider.BITBUCKET]: 'https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/',
};

export const WebhookDocLinks = {
  [GitProvider.GITHUB]:
    'https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks',
  [GitProvider.GITLAB]:
    'https://docs.gitlab.com/ee/user/project/integrations/webhooks.html#configure-a-webhook-in-gitlab',
  [GitProvider.BITBUCKET]: 'https://support.atlassian.com/bitbucket-cloud/docs/manage-webhooks/',
};

const WebhookSection: FC<WebhoookSectionProps> = ({ pac, formContextField }) => {
  const [namespace] = useActiveNamespace();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const fieldPrefix = formContextField ? `${formContextField}.` : '';
  const { gitProvider, webhook } = _.get(values, formContextField) || values;
  const [controllerUrl, setControllerUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const ctlUrl = pac?.data?.['controller-url'];
    if (ctlUrl) {
      setControllerUrl(ctlUrl);
      setFieldValue(`${fieldPrefix}webhook.url`, ctlUrl);
    }
  }, [fieldPrefix, pac, setFieldValue]);

  const autocompleteFilter = (text: string, item: any): boolean => fuzzy(text, item?.props?.name);

  const watchedResources = useK8sWatchResources<{ secrets: SecretKind[] }>({
    secrets: {
      isList: true,
      kind: referenceForModel(SecretModel),
      namespace,
    },
  });

  const resources = useMemo(
    () => [
      {
        data: watchedResources.secrets.data,
        loaded: watchedResources.secrets.loaded,
        loadError: watchedResources.secrets.loadError,
        kind: SecretModel.kind,
      },
    ],
    [
      watchedResources.secrets.data,
      watchedResources.secrets.loaded,
      watchedResources.secrets.loadError,
    ],
  );

  const generateWebhookSecret = () => {
    setWebhookSecret(generateSecret());
  };

  const getPermssionSectionHeading = (git: GitProvider) => {
    switch (git) {
      case GitProvider.GITHUB:
        return t('devconsole~See GitHub events');
      case GitProvider.GITLAB:
        return t('devconsole~See GitLab events');
      case GitProvider.BITBUCKET:
        return t('devconsole~See Bitbucket events');
      default:
        return t('devconsole~See Git events');
    }
  };

  const HelpText = (): ReactElement => {
    let helpText: ReactNode;
    switch (gitProvider) {
      case GitProvider.GITHUB:
        helpText = (
          <Trans t={t} ns="devconsole">
            Use your GitHub Personal token. Use this{' '}
            <ExternalLink href={AccessTokenDocLinks[GitProvider.GITHUB]}>link</ExternalLink> to
            create a <b>classic</b> token with <b>repo</b> & <b>admin:repo_hook</b> scopes and give
            your token an expiration, i.e 30d.
          </Trans>
        );
        break;

      case GitProvider.GITLAB:
        helpText = (
          <Trans t={t} ns="devconsole">
            Use your Gitlab Personal access token. Use this{' '}
            <ExternalLink href={AccessTokenDocLinks[GitProvider.GITLAB]}>link</ExternalLink> to
            create a token with <b>api</b> scope. Select the role as <b>Maintainer/Owner</b>. Give
            your token an expiration i.e 30d.
          </Trans>
        );
        break;

      case GitProvider.BITBUCKET:
        helpText = (
          <Trans t={t} ns="devconsole">
            Use your Bitbucket App password. Use this{' '}
            <ExternalLink href={AccessTokenDocLinks[GitProvider.BITBUCKET]}>link</ExternalLink> to
            create a token with <b>Read and Write </b>scopes in{' '}
            <b>Account, Workspace membership, Projects, Issues, Pull requests and Webhooks</b>.
          </Trans>
        );
        break;

      default:
        helpText = (
          <Trans t={t} ns="devconsole">
            Use your Git Personal token. Create a token with repo, public_repo & admin:repo_hook
            scopes and give your token an expiration, i.e 30d.
          </Trans>
        );
    }

    return <div data-test={`${values.gitProvider}-helptext`}>{helpText}</div>;
  };

  return (
    <FormSection fullWidth={!fieldPrefix} extraMargin>
      {gitProvider && gitProvider === GitProvider.BITBUCKET ? (
        <InputField
          label={t('devconsole~Bitbucket username')}
          name={`${fieldPrefix}webhook.user`}
          type={TextInputTypes.text}
          required
        />
      ) : null}
      <RadioGroupField
        name={`${fieldPrefix}webhook.method`}
        label={t('devconsole~Secret')}
        labelIcon={
          <Tooltip
            position="right"
            content={
              <p>
                {t(
                  'devconsole~The secret is required to set the Build status and to attach the webhook to the Git repository.',
                )}
              </p>
            }
          >
            <HelpIcon />
          </Tooltip>
        }
        required
        options={[
          {
            value: 'token',
            label: t('devconsole~Git access token'),
            activeChildren: (
              <InputField
                name={`${fieldPrefix}webhook.token`}
                type={TextInputTypes.text}
                helpText={<HelpText />}
                required
              />
            ),
          },
          {
            value: 'secret',
            label: t('devconsole~Git access token secret'),

            activeChildren: (
              <ResourceDropdownField
                helpText={t(
                  'devconsole~Secret with the Git access token for pulling pipeline and tasks from your Git repository.',
                )}
                name={`${fieldPrefix}webhook.secretRef`}
                resources={resources}
                dataSelector={['metadata', 'name']}
                placeholder={t('devconsole~Select a secret')}
                autocompleteFilter={autocompleteFilter}
                fullWidth
                showBadge
                onChange={(k, v, res) => {
                  if (res && res.data) {
                    setFieldValue(`${fieldPrefix}webhook.secretObj`, res);
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
      {webhook?.url && (
        <FormGroup fieldId="test" label={t('devconsole~Webhook URL')}>
          <ClipboardCopy
            isReadOnly
            name={`${fieldPrefix}webhook.url`}
            hoverTip="Copy"
            clickTip="Copied"
            style={{ flex: '1' }}
          >
            {controllerUrl}
          </ClipboardCopy>

          <FormHelperText>
            <HelperText>
              <HelperTextItem>
                {t(
                  'devconsole~We have detected a URL that can be used to configure the webhook. It will be created and attached to the Git repository.',
                )}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      )}

      {gitProvider && gitProvider !== GitProvider.BITBUCKET ? (
        <FormGroup fieldId={'webhook-secret-clipboard'} label={t('devconsole~Webhook secret')}>
          <InputGroup style={{ display: 'flex' }}>
            <InputGroupItem>
              <ClipboardCopy
                name={`${fieldPrefix}webhook.secret`}
                hoverTip="Copy"
                clickTip="Copied"
                style={{ flex: '1' }}
                onChange={(_event, v) => {
                  setFieldValue(`${fieldPrefix}webhook.secret`, v);
                }}
              >
                {webhookSecret}
              </ClipboardCopy>
            </InputGroupItem>
            <InputGroupItem>
              <Button data-test="generate-secret" variant="control" onClick={generateWebhookSecret}>
                {t('devconsole~Generate')}
              </Button>
            </InputGroupItem>
          </InputGroup>
        </FormGroup>
      ) : null}

      {gitProvider && gitProvider !== GitProvider.UNSURE ? (
        <>
          <ExpandableSection toggleText={getPermssionSectionHeading(gitProvider)}>
            <FormGroup
              label={t('devconsole~Events triggering the webhook: ')}
              fieldId="repo-permissions"
            >
              <Content component={ContentVariants.small}>
                <PermissionsSection formContextField={formContextField} />
              </Content>
            </FormGroup>
          </ExpandableSection>

          <ExternalLink
            text={t('devconsole~Read more about setting up webhook')}
            href={WebhookDocLinks[gitProvider]}
          />
        </>
      ) : null}
    </FormSection>
  );
};

export default WebhookSection;
