import * as React from 'react';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useTranslation } from 'react-i18next';
import * as semver from 'semver';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { useOpenShiftVersion } from '@console/shared/src/hooks/version';

const DevPerspectiveTourText: React.FC = () => {
  const { t } = useTranslation();
  const fullVersion = useOpenShiftVersion();
  const parsed = semver.parse(fullVersion);
  // Show only major and minor version.
  const version = parsed ? `${parsed.major}.${parsed.minor}` : '4.x';
  return (
    <>
      {t(
        "devconsole~Get started with a tour of some of the key areas in OpenShift {{version}}'s Developer perspective that can help you complete workflows and be more productive.",
        { version },
      )}
    </>
  );
};

export const devPerspectiveTourText = <DevPerspectiveTourText />;

const PerspectiveSwitcherTourText: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <p>{t('devconsole~Switch between the Developer and Core platform perspectives.')}</p>
      <p>
        {t(
          'devconsole~Use the Core platform perspective to manage workload storage, networking, cluster settings, and more. This may require additional user access.',
        )}
      </p>
      <p>
        {t(
          'devconsole~Use the Developer perspective to build applications and associated components and services, define how they work together, and monitor their health over time.',
        )}
      </p>
    </>
  );
};

export const perspectiveSwitcherTourText = <PerspectiveSwitcherTourText />;

const WebTerminalGuidedTourText: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <p>
        {t(
          'devconsole~Use command line tools directly from the Console. CLIs are pre-installed and fully authenticated when you need them.',
        )}
      </p>
      <p>
        <ExternalLink
          href="https://developers.redhat.com/products/odo/overview"
          text={t('devconsole~Access odo CLI')}
        />
      </p>
    </>
  );
};

export const webTerminalGuidedTourText = <WebTerminalGuidedTourText />;

export const SearchTourText: React.FC = () => {
  const { t } = useTranslation();
  return (
    <>
      <p>
        {t(
          'devconsole~Search for resources in your Project by simply starting to type or scrolling through a list of existing resources.',
        )}
      </p>
      <p>
        {t(
          'devconsole~Add frequently accessed resources to your side navigation for quick access. Look for the',
        )}{' '}
        <span
          style={{
            color: 'var(--pf-t--global--icon--color--brand--default)',
          }}
        >
          <PlusCircleIcon /> {t('devconsole~Add to navigation')}
        </span>{' '}
        {t('devconsole~link next to your search result.')}
      </p>
    </>
  );
};

export const searchTourText = <SearchTourText />;
