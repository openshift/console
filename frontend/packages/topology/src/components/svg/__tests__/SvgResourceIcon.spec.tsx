import { render, screen } from '@testing-library/react';
import SvgResourceIcon, { getKindStringAndAbbreviation } from '../SvgResourceIcon';
import '@testing-library/jest-dom';

jest.mock('@patternfly/react-topology', () => ({
  useSize: jest.fn(() => {
    return [{ width: 20, height: 10 }, { current: null }];
  }),
}));

describe(getKindStringAndAbbreviation.name, () => {
  it('should return correct name and its abbreviation for the given string', () => {
    expect(getKindStringAndAbbreviation('DeploymentConfig')).toEqual({
      kindAbbr: 'DC',
      kindStr: 'DeploymentConfig',
    });
    expect(getKindStringAndAbbreviation('Deployment')).toEqual({
      kindAbbr: 'D',
      kindStr: 'Deployment',
    });
    expect(getKindStringAndAbbreviation('DaemonSet')).toEqual({
      kindAbbr: 'DS',
      kindStr: 'DaemonSet',
    });
  });
});

describe(SvgResourceIcon.name, () => {
  it('should render', () => {
    render(<SvgResourceIcon kind="Deployment" x={0} y={0} />);
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('should render correct kind abbreviation', () => {
    render(<SvgResourceIcon kind="DaemonSet" x={0} y={0} />);
    expect(screen.getByText('DS')).toBeInTheDocument();
  });
});
