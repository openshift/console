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
  Tooltip,
} from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { FormikValues, useFormikContext } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { Base64 } from 'js-base64';
import * as _ from 'lodash';
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
  formContextField?: string;
};

const WebhookSection: React.FC<WebhoookSectionProps> = ({ pac, formContextField }) => {
  const [namespace] = useActiveNamespace();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const fieldPrefix = formContextField ? `${formContextField}.` : '';
  const { gitProvider, webhook } = _.get(values, formContextField) || values;
  const [controllerUrl, setControllerUrl] = React.useState('');
  const [webhookSecret, setWebhookSecret] = React.useState('');
  const { t } = useTranslation();

  React.useEffect(() => {
    const ctlUrl = pac?.data?.['controller-url'];
    if (ctlUrl) {
      setControllerUrl(ctlUrl);
      setFieldValue(`${fieldPrefix}webhook.url`, ctlUrl);
    }
  }, [fieldPrefix, pac, setFieldValue]);
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
        return t('pipelines-plugin~See GitHub events');
      case GitProvider.GITLAB:
        return t('pipelines-plugin~See Gitlab events');
      case GitProvider.BITBUCKET:
        return t('pipelines-plugin~See BitBucket events');
      default:
        return t('pipelines-plugin~See Git events');
    }
  };

  const HelpText = (): React.ReactElement => {
    let helpText: React.ReactNode;
    switch (gitProvider) {
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
            to create a <b>classic</b> token with <b>repo</b> & <b>admin:repo_hook</b> scopes and
            give your token an expiration, i.e 30d.
          </Trans>
        );
        break;

      case GitProvider.GITLAB:
        helpText = (
          <Trans t={t} ns="pipelines-plugin">
            Use your Gitlab Personal access token. Use this{' '}
            <a
              href={AccessTokenDocLinks[GitProvider.GITLAB]}
              target="_blank"
              rel="noopener noreferrer"
            >
              link
            </a>{' '}
            to create a token with <b>api</b> scope. Select the role as <b>Maintainer/Owner</b>.
            Give your token an expiration i.e 30d.
          </Trans>
        );
        break;

      case GitProvider.BITBUCKET:
        helpText = (
          <Trans t={t} ns="pipelines-plugin">
            Use your Bitbucket App password. Use this{' '}
            <a
              href={AccessTokenDocLinks[GitProvider.BITBUCKET]}
              target="_blank"
              rel="noopener noreferrer"
            >
              link
            </a>{' '}
            to create a token with <b>Read and Write </b>scopes in{' '}
            <b>Account, Workspace membership, Projects, Issues, Pull requests and Webhooks</b>.
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
    <FormSection fullWidth={!fieldPrefix} extraMargin>
      {gitProvider && gitProvider === GitProvider.BITBUCKET ? (
        <InputField
          label={t('pipelines-plugin~Bitbucket username')}
          name={`${fieldPrefix}webhook.user`}
          type={TextInputTypes.text}
          required
        />
      ) : null}
      <RadioGroupField
        name={`${fieldPrefix}webhook.method`}
        label={t('pipelines-plugin~Secret')}
        labelIcon={
          <Tooltip
            position="right"
            content={
              <p>
                {t(
                  'pipelines-plugin~The secret is required to set the Build status and to attach the webhook to the Git repository.',
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
            label: t('pipelines-plugin~Git access token'),
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
            label: t('pipelines-plugin~Git access token secret'),

            activeChildren: (
              <ResourceDropdownField
                helpText={t(
                  'pipelines-plugin~Secret with the Git access token for pulling pipeline and tasks from your Git repository.',
                )}
                name={`${fieldPrefix}webhook.secretRef`}
                resources={resources}
                dataSelector={['metadata', 'name']}
                placeholder={t('pipelines-plugin~Select a secret')}
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
        <FormGroup
          fieldId="test"
          label={t('pipelines-plugin~Webhook URL')}
          helperText={t(
            'pipelines-plugin~We have detected a URL that can be used to configure the webhook. It will be created and attached to the Git repository.',
          )}
        >
          <ClipboardCopy
            isReadOnly
            name={`${fieldPrefix}webhook.url`}
            hoverTip="Copy"
            clickTip="Copied"
            style={{ flex: '1' }}
          >
            {controllerUrl}
          </ClipboardCopy>
        </FormGroup>
      )}

      {gitProvider && gitProvider !== GitProvider.BITBUCKET ? (
        <FormGroup
          fieldId={'webhook-secret-clipboard'}
          label={t('pipelines-plugin~Webhook secret')}
        >
          <InputGroup style={{ display: 'flex' }}>
            <ClipboardCopy
              name={`${fieldPrefix}webhook.secret`}
              hoverTip="Copy"
              clickTip="Copied"
              style={{ flex: '1' }}
              onChange={(v) => {
                setFieldValue(`${fieldPrefix}webhook.secret`, v);
              }}
            >
              {webhookSecret}
            </ClipboardCopy>
            <Button data-test="generate-secret" variant="control" onClick={generateWebhookSecret}>
              {t('pipelines-plugin~Generate')}
            </Button>
          </InputGroup>
        </FormGroup>
      ) : null}

      {gitProvider && gitProvider !== GitProvider.UNSURE ? (
        <>
          <ExpandableSection toggleText={getPermssionSectionHeading(gitProvider)}>
            <FormGroup
              label={t('pipelines-plugin~Events triggering the webhook: ')}
              fieldId="repo-permissions"
            >
              <Text component={TextVariants.small}>
                <PermissionsSection formContextField={formContextField} />
              </Text>
            </FormGroup>
          </ExpandableSection>

          <ExternalLink
            text={t('pipelines-plugin~Read more about setting up webhook')}
            href={WebhookDocLinks[gitProvider]}
          />
        </>
      ) : null}
    </FormSection>
  );
};

export default WebhookSection;
