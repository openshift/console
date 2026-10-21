import type { FC } from 'react';
import { Fragment } from 'react';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Button, Divider } from '@patternfly/react-core';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { FLAGS } from '@console/shared/src/constants/common';
import { useCopyLoginCommands } from '@console/shared/src/hooks/useCopyLoginCommands';
import SecondaryHeading from '@console/shared/src/components/heading/SecondaryHeading';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { ConsoleCLIDownloadModel } from '../models';
import { referenceForModel } from '../module/k8s';
import { MarkdownView } from '@console/shared/src/components/markdown/MarkdownView';
import { useCopyCodeModal } from '@console/shared/src/hooks/useCopyCodeModal';
import { useK8sWatchResource } from './utils/k8s-watch-hook';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { LoadingBox } from './utils/status-box';

type CLIDownload = K8sResourceCommon & {
  spec: {
    displayName: string;
    description?: string;
    links: { href: string; text?: string }[];
  };
};

export const CommandLineTools: FC<CommandLineToolsProps> = ({ obj }) => {
  const { t } = useTranslation();
  const [requestTokenURL, externalLoginCommand] = useCopyLoginCommands();
  const launchCopyLoginCommandModal = useCopyCodeModal(
    t('public~Login with this command'),
    externalLoginCommand,
  );
  const showCopyLoginCommand = requestTokenURL || externalLoginCommand;
  const data = _.sortBy(obj.data, 'spec.displayName');
  const cliData = _.remove(data, (item) => item.metadata.name === 'oc-cli-downloads');

  const additionalCommandLineTools = _.map(cliData.concat(data), (tool, index) => {
    const displayName = tool.spec.displayName;
    const defaultLinkText = t('Download {{displayName}}', { displayName });
    const sortedLinks = _.sortBy(tool.spec.links, 'text');
    return (
      <Fragment key={tool.metadata.uid}>
        {index > 0 && <Divider className="co-divider" />}
        <SecondaryHeading data-test-id={displayName}>{displayName}</SecondaryHeading>
        <MarkdownView content={tool.spec.description} exactHeight />
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
      </Fragment>
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

export const CommandLineToolsPage = () => {
  const { t } = useTranslation();
  const shouldFetch = useFlag(FLAGS.CONSOLE_CLI_DOWNLOAD);
  const [cliDownloads, loaded, loadError] = useK8sWatchResource(
    shouldFetch
      ? {
          kind: referenceForModel(ConsoleCLIDownloadModel),
          isList: true,
        }
      : null,
  );

  if (!loaded && !loadError) {
    return (
      <>
        <DocumentTitle>{t('public~Command Line Tools')}</DocumentTitle>
        <PageHeading title={t('public~Command Line Tools')} />
        <LoadingBox />
      </>
    );
  }

  return <CommandLineTools obj={{ data: cliDownloads as CLIDownload[], loaded, loadError }} />;
};

type CommandLineToolsProps = {
  obj: {
    data: CLIDownload[];
    loaded: boolean;
    loadError?: unknown;
  };
};
