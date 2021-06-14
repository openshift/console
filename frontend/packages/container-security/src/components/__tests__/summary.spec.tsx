import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { fakeVulnFor } from '../../../integration-tests/bad-pods';
import { Priority } from '../../const';
import { SecurityBreakdownPopup, securityHealthHandler } from '../summary';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const highVuln = fakeVulnFor(Priority.High);

describe('securityHealthHandler', () => {
  it('returns `UNKNOWN` status if there is an error retrieving `ImageManifestVulns`', () => {
    const vulnerabilities = {
      imageManifestVuln: { loaded: true, loadError: 'failed to fetch', data: [] },
    };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.UNKNOWN);
  });

  it('returns `LOADING` status if still retrieving `ImageManifestVulns`', () => {
    const vulnerabilities = { imageManifestVuln: { loaded: false, loadError: null, data: [] } };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.LOADING);
  });

  it('returns `Error` status if any `ImageManifestVulns` exist', () => {
    const vulnerabilities = {
      imageManifestVuln: { loaded: true, loadError: null, data: [highVuln] },
    };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.ERROR);
  });

  it('returns `OK` status if no vulnerabilities', () => {
    const vulnerabilities = { imageManifestVuln: { loaded: true, loadError: null, data: [] } };
    const health = securityHealthHandler(vulnerabilities);

    expect(health.state).toEqual(HealthState.OK);
  });
});

describe('SecurityBreakdownPopup', () => {
  type SecurityBreakdownPopupProps = React.ComponentProps<typeof SecurityBreakdownPopup>;
  let wrapper: ShallowWrapper<SecurityBreakdownPopupProps>;
  const i18nNS = 'container-security~';
  const imageManifestVuln = {
    loaded: true,
    loadError: null,
    data: [{ ...highVuln, status: { ...highVuln.status, fixableCount: 27 } }],
  };
  beforeEach(() => {
    wrapper = shallow(<SecurityBreakdownPopup imageManifestVuln={imageManifestVuln} />);
  });

  it('should display proper message when there are no vulnerabilities', () => {
    wrapper = shallow(
      <SecurityBreakdownPopup imageManifestVuln={{ loaded: true, loadError: null, data: [] }} />,
    );
    expect(wrapper.contains(`${i18nNS}No vulnerabilities detected.`)).toBe(true);
  });

  it('should not display section for list of vulnerabilities if there are no fixable vulnerabilities', () => {
    wrapper = shallow(
      <SecurityBreakdownPopup
        imageManifestVuln={{
          loaded: true,
          loadError: null,
          data: [{ ...highVuln, status: { ...highVuln.status, fixableCount: 0 } }],
        }}
      />,
    );
    expect(
      wrapper.contains(
        <span className="co-status-popup__text--bold">{`${i18nNS}Fixable Container Images`}</span>,
      ),
    ).toBe(false);
  });

  it('should display list of impact and vulnerabilities when not in context of a namespace', () => {
    expect(
      wrapper.contains(<span className="co-status-popup__text--bold">{`${i18nNS}Impact`}</span>),
    ).toBe(true);
  });

  it('should display list of images and vulnerabilities when in context of a namespace', () => {
    wrapper = shallow(
      <SecurityBreakdownPopup imageManifestVuln={imageManifestVuln} namespace="default" />,
    );
    expect(
      wrapper.contains(<span className="co-status-popup__text--bold">{`${i18nNS}Image`}</span>),
    ).toBe(true);
  });
});
