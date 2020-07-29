import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { RootState } from '@console/internal/redux';
import { useOpenshiftVersion } from '@console/shared/src/hooks/version';
import { K8sResourceCommon } from '@console/internal/module/k8s';

const DevPerspectiveTourText: React.FC = () => {
  const openshiftVersion = useOpenshiftVersion();
  return (
    <>
      Welcome to OpenShift {openshiftVersion?.slice(0, 3) ?? '4.x'}. Get started with a tour of some
      of the key areas in the Developer perspective that can help you complete your workflows and be
      more productive.
    </>
  );
};

export const devPerspectiveTourText = <DevPerspectiveTourText />;

export const perspectiveSwitcherTourText = (
  <>
    <p>
      The Perspective Switcher allows you to switch between the Developer and Admin perspectives.
    </p>
    <p>
      Use the Admin perspective to manage workloads storage, networking, cluster settings, and more.
      This may require additional user access.
    </p>
    <p>
      Use the Developer perspective to build applications and associated components and services,
      define how they work together, and monitor their health over time.
    </p>
  </>
);

export const searchTourText = (
  <>
    <p>
      Search for resources in your project by simply starting to type or scrolling through a list of
      existing resources.
    </p>
    <p>
      Add frequently accessed resources to your side navigation for quick access. Look for the{' '}
      <span style={{ color: 'var(--pf-global--palette--blue-400)' }}>
        <PlusCircleIcon /> Add to navigation
      </span>{' '}
      link next to your search result.
    </p>
  </>
);

const FinishTourText: React.FC = () => {
  const consoleLinks = useSelector<K8sResourceCommon[]>((state: RootState) =>
    state.UI.get('consoleLinks'),
  );
  const openshiftBlogLink = consoleLinks.filter(
    (link: K8sResourceCommon) => link.metadata.name === 'openshift-blog',
  )[0]?.spec?.href;
  // declaring openshiftHelpBase instead of importing because it throws error while using it as tour extension
  const openshiftHelpBase =
    window.SERVER_FLAGS.documentationBaseURL || 'https://docs.okd.io/latest/';
  const openshiftVersion: string = useOpenshiftVersion();
  return (
    <>
      Thanks for using OpenShift {openshiftVersion?.slice(0, 3) ?? '4.x'}. Stay up-to-date with
      everything OpenShift on our{' '}
      <a href={openshiftBlogLink} target="_blank" rel="noopener noreferrer">
        blog
      </a>{' '}
      or can continue to learn more in our{' '}
      <a href={openshiftHelpBase} target="_blank" rel="noopener noreferrer">
        documentation
      </a>
      .
    </>
  );
};

export const finishTourText = <FinishTourText />;
