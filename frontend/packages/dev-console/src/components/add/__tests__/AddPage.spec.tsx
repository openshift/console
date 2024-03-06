import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import CreateProjectListPage from '../../projects/CreateProjectListPage';
import { PageContents as AddPage } from '../AddPage';
import AddCardsLoader from '../AddPageLayout';

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/shared', () => {
  const originalModule = (jest as any).requireActual('@console/shared');
  return {
    ...originalModule,
    useFlag: jest.fn<boolean>(),
  };
});

describe('AddPage', () => {
  let wrapper: ShallowWrapper;

  it('should render AddCardsLoader if namespace exists', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'ns',
    });
    wrapper = shallow(<AddPage />);
    expect(wrapper.find(AddCardsLoader).exists()).toBe(true);
  });

  it('should render CreateProjectListPage if namespace does not exist', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({});
    wrapper = shallow(<AddPage />);
    expect(wrapper.find(CreateProjectListPage).exists()).toBe(true);
  });
});
