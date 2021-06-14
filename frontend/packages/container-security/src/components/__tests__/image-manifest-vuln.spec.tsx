import * as React from 'react';
import { ChartDonut } from '@patternfly/react-charts';
import { SecurityIcon } from '@patternfly/react-icons';
import { ShallowWrapper, shallow } from 'enzyme';
import { fakeVulnFor } from '../../../integration-tests/bad-pods';
import { Priority, totalFor, vulnPriority } from '../../const';
import {
  ImageManifestVulnDetails,
  ImageManifestVulnDetailsProps,
  totalCount,
  highestSeverityIndex,
} from '../image-manifest-vuln';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('totalCount', () => {
  it('should return 0 if vuln status not present', () => {
    const vuln = fakeVulnFor(Priority.Critical);
    delete vuln.status;
    const tCount = totalCount(vuln);
    expect(tCount).toBe(0);
  });
  it('Total vuln should be 2', () => {
    const vuln = fakeVulnFor(Priority.Critical);
    const tCount = totalCount(vuln);
    expect(tCount).toBe(2);
  });
});

describe('highestSeverityIndex', () => {
  it('should return the correct indexes for different priorities', () => {
    expect(highestSeverityIndex(fakeVulnFor(Priority.Defcon1))).toBe(0);
    expect(highestSeverityIndex(fakeVulnFor(Priority.Critical))).toBe(1);
    expect(highestSeverityIndex(fakeVulnFor(Priority.High))).toBe(2);
    expect(highestSeverityIndex(fakeVulnFor(Priority.Medium))).toBe(3);
    expect(highestSeverityIndex(fakeVulnFor(Priority.Low))).toBe(4);
    expect(highestSeverityIndex(fakeVulnFor(Priority.Negligible))).toBe(5);
    expect(highestSeverityIndex(fakeVulnFor(Priority.Unknown))).toBe(6);
  });
});

describe(ImageManifestVulnDetails.displayName, () => {
  let wrapper: ShallowWrapper<ImageManifestVulnDetailsProps>;
  const vuln = fakeVulnFor(Priority.Critical);

  beforeEach(() => {
    wrapper = shallow(<ImageManifestVulnDetails obj={vuln} />);
  });

  it('renders donut chart with breakdown of vulnerabilities by severity', () => {
    const chart = wrapper.find(ChartDonut);

    chart.props().data.forEach((d) => {
      expect(vulnPriority.has(d.x)).toBe(true);
      expect(d.y).toEqual(totalFor(d.x)(vuln));
    });
    expect(chart.props().title).toEqual('container-security~{{total, number}} total');
    expect(chart.props().colorScale).toEqual(
      vulnPriority.map((priority) => priority.color.value).toArray(),
    );
  });

  it('renders text breakdown of vulnerabilities by severity', () => {
    expect(
      wrapper.find('.cs-imagemanifestvuln-details__summary').find(SecurityIcon).length,
    ).toEqual(2);
  });
});
