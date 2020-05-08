import * as React from 'react';
import { SecurityIcon } from '@patternfly/react-icons';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';
import { ChartDonut } from '@patternfly/react-charts';
import {
  ImageVulnerabilityRow,
  ImageVulnerabilityRowProps,
  ImageVulnerabilitiesTable,
  ImageVulnerabilitiesTableProps,
  ImageManifestVulnDetails,
  ImageManifestVulnDetailsProps,
} from '../image-manifest-vuln';
import { fakeVulnFor } from '../../../integration-tests/bad-pods';
import { Priority, vulnPriority, totalFor, priorityFor } from '../../const';

describe(ImageVulnerabilityRow.displayName, () => {
  let wrapper: ShallowWrapper<ImageVulnerabilityRowProps>;

  it('renders a `SecurityIcon` with the correct color for the severity', () => {
    const vuln = fakeVulnFor(Priority.Critical);

    wrapper = shallow(
      <ImageVulnerabilityRow
        vulnerability={vuln.spec.features[0].vulnerabilities[0]}
        currentVersion={vuln.spec.features[0].version}
        packageName={vuln.spec.features[0].name}
      />,
    );

    expect(wrapper.find(SecurityIcon).props().color).toEqual(
      vulnPriority.get(Priority.Critical).color.value,
    );
  });
});

describe(ImageVulnerabilitiesTable.displayName, () => {
  let wrapper: ShallowWrapper<ImageVulnerabilitiesTableProps>;

  it('displays vulnerabilities sorted by their severity', () => {
    const vuln = fakeVulnFor(Priority.Critical);

    wrapper = shallow(<ImageVulnerabilitiesTable features={vuln.spec.features} />);

    expect(wrapper.find(ImageVulnerabilityRow).length).toEqual(3);
    const indexes = wrapper
      .find(ImageVulnerabilityRow)
      .map((r) => priorityFor(r.props().vulnerability.severity).index);
    expect(indexes).toEqual(_.sortBy(indexes));
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
    expect(chart.props().title).toEqual(`3 total`);
    expect(chart.props().colorScale).toEqual(
      vulnPriority.map((priority) => priority.color.value).toArray(),
    );
  });

  it('renders text breakdown of vulnerabilities by severity', () => {
    expect(wrapper.find('.imagemanifestvuln-details__summary').find(SecurityIcon).length).toEqual(
      2,
    );
  });
});
