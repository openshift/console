import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import CreateProjectListPage from '../../projects/CreateProjectListPage';
import { PageContents as AddPage } from '../AddPage';
import AddCardsLoader from '../AddPageLayout';

describe('AddPage', () => {
  type AddPageProps = React.ComponentProps<typeof AddPage>;
  let wrapper: ShallowWrapper<AddPageProps>;
  const props: AddPageProps = {
    match: {
      params: {
        ns: 'ns',
      },
      path: '',
      isExact: true,
      url: '',
    },
  };

  it('should render AddCardsLoader if namespace exists', () => {
    wrapper = shallow(<AddPage {...props} />);
    expect(wrapper.find(AddCardsLoader).exists()).toBe(true);
  });

  it('should render CreateProjectListPage if namespace does not exist', () => {
    delete props.match.params.ns;
    wrapper = shallow(<AddPage {...props} />);
    expect(wrapper.find(CreateProjectListPage).exists()).toBe(true);
  });
});
