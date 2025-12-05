import * as React from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { Button, Divider } from '@patternfly/react-core';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { FLAGS } from '@console/shared/src/constants/common';
import { useCopyLoginCommands } from '@console/shared/src/hooks/useCopyLoginCommands';
import SecondaryHeading from '@console/shared/src/components/heading/SecondaryHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { Firehose } from './utils/firehose';
import { FirehoseResult } from './utils/types';
import { connectToFlags } from '../reducers/connectToFlags';
import { ConsoleCLIDownloadModel } from '../models';
import { referenceForModel } from '../module/k8s';
import { SyncMarkdownView } from './markdown-view';
import { useCopyCodeModal } from '@console/shared/src/hooks/useCopyCodeModal';

export const CommandLineTools: React.FC<CommandLineToolsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const [requestTokenURL, externalLoginCommand] = useCopyLoginCommands();
  const launchCopyLoginCommandModal = useCopyCodeModal(
    t('public~Login with this command'),
    externalLoginCommand,
  );
  const showCopyLoginCommand = requestTokenURL || externalLoginCommand;
  const data = _.sortBy(_.get(obj, 'data'), 'spec.displayName');
  const cliData = _.remove(data, (item) => item.metadata.name === 'oc-cli-downloads');

  const additionalCommandLineTools = _.map(cliData.concat(data), (tool, index) => {
    const displayName = tool.spec.displayName;
    const defaultLinkText = t('Download {{displayName}}', { displayName });
    const sortedLinks = _.sortBy(tool.spec.links, 'text');
    return (
      <React.Fragment key={tool.metadata.uid}>
        {index > 0 && <Divider className="co-divider" />}
        <SecondaryHeading data-test-id={displayName}>{displayName}</SecondaryHeading>
        <SyncMarkdownView content={tool.spec.description} exactHeight />
        {sortedLinks.length === 1 && (
          <p>
            <ExternalLink
              href={sortedLinks[0].href}
              text={sortedLinks[0].text || defaultLinkText}
            />
          </p>
        )}
        {sortedLinks.length > 1 && (
          <ul>
            {_.map(sortedLinks, (link, i) => (
              <li key={i}>
                <ExternalLink href={link.href} text={link.text || defaultLinkText} />
              </li>
            ))}
          </ul>
        )}
      </React.Fragment>
    );
  });

  return (
    <>
      <DocumentTitle>{t('public~Command Line Tools')}</DocumentTitle>
      <PageHeading title={t('public~Command Line Tools')} />
      <PaneBody>
        {showCopyLoginCommand && (
          <>
            {requestTokenURL ? (
              <ExternalLink href={requestTokenURL} text={t('public~Copy login command')} />
            ) : (
              <Button variant="link" onClick={launchCopyLoginCommandModal}>
                {t('public~Copy login command')}
              </Button>
            )}
            <Divider className="co-divider" />
          </>
        )}
        {additionalCommandLineTools}
      </PaneBody>
    </>
  );
};

export const CommandLineToolsPage = connectToFlags(FLAGS.CONSOLE_CLI_DOWNLOAD)(
  ({ flags, ...props }) => {
    const resources = flags[FLAGS.CONSOLE_CLI_DOWNLOAD]
      ? [
          {
            kind: referenceForModel(ConsoleCLIDownloadModel),
            isList: true,
            prop: 'obj',
          },
        ]
      : [];

    return (
      <Firehose resources={resources}>
        <CommandLineTools {...(props as any)} />
      </Firehose>
    );
  },
);

type CommandLineToolsProps = {
  obj: FirehoseResult;
};
