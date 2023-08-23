import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import AddCardSection from '../AddCardSection';
import AddCardSectionEmptyState from '../AddCardSectionEmptyState';
import { MasonryLayout } from '../layout/MasonryLayout';
import { addActionExtensions, addActionGroupExtensions } from './add-page-test-data';

describe('AddCardSection', () => {
  type AddCardSectionProps = React.ComponentProps<typeof AddCardSection>;
  let wrapper: ShallowWrapper<AddCardSectionProps>;
  const props: AddCardSectionProps = {
    namespace: 'ns',
    addActionExtensions,
    addActionGroupExtensions,
  };

  it('should render Empty state if extensionsLoaded is true but loadingError is also true', () => {
    wrapper = shallow(
      <AddCardSection {...props} addActionExtensions={[]} extensionsLoaded loadingFailed />,
    );
    expect(wrapper.find(AddCardSectionEmptyState).exists()).toBe(true);
  });

  it('should render Empty state if extensionsLoaded is true but accessCheckError is also true', () => {
    wrapper = shallow(
      <AddCardSection {...props} addActionExtensions={[]} extensionsLoaded accessCheckFailed />,
    );
    expect(wrapper.find(AddCardSectionEmptyState).exists()).toBe(true);
  });

  it('should render MasonryLayout if extensionsLoaded is true and addActionExtensions array is not empty', () => {
    wrapper = shallow(<AddCardSection {...props} extensionsLoaded />);
    expect(wrapper.find(MasonryLayout).exists()).toBe(true);
  });
});
