import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
import { LoadingBox, PageHeading } from '@console/internal/components/utils';
import { usePacGHManifest } from '../hooks/usePacGHManifest';
import PacForm from '../PacForm';

jest.mock('../hooks/usePacGHManifest', () => ({
  usePacGHManifest: jest.fn(),
}));

type PacFormProps = React.ComponentProps<typeof PacForm>;
const mockUsePacGHManifest = usePacGHManifest as jest.Mock;

describe('PacForm', () => {
  let wrapper: ShallowWrapper<PacFormProps>;
  let pacFormProps: PacFormProps;

  beforeEach(() => {
    pacFormProps = {
      namespace: 'openshift-pipelines',
    };
  });

  it('should show loading if manifest is not loaded', () => {
    mockUsePacGHManifest.mockReturnValue({ loaded: false, manifestData: {} });
    wrapper = shallow(<PacForm {...pacFormProps} />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('should show form if manifest is loaded', () => {
    mockUsePacGHManifest.mockReturnValue({ loaded: true, manifestData: {} });
    wrapper = shallow(<PacForm {...pacFormProps} />);
    expect(wrapper.find(PageHeading).exists()).toBe(true);
    expect(wrapper.find(Formik).exists()).toBe(true);
  });
});
