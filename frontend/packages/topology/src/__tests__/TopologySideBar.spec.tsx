import * as React from 'react';
import { shallow } from 'enzyme';
import { CloseButton } from '@console/internal/components/utils';
import TopologySideBar from '../components/side-bar/TopologySideBar';
import OdcBaseNode from '../elements/OdcBaseNode';
import { TYPE_WORKLOAD } from '../const';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: () => ['', () => {}],
}));

describe('TopologySideBar:', () => {
  const onClose = jest.fn();
  const selectedEntity: OdcBaseNode = new OdcBaseNode();
  selectedEntity.setType(TYPE_WORKLOAD);
  it('renders a SideBar', () => {
    const wrapper = shallow(<TopologySideBar selectedEntity={selectedEntity} onClose={onClose} />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('clicking on close button should call the onClose callback function', () => {
    const wrapper = shallow(<TopologySideBar selectedEntity={selectedEntity} onClose={onClose} />);
    wrapper
      .find(CloseButton)
      .shallow()
      .find('button')
      .simulate('click');
    expect(onClose).toHaveBeenCalled();
  });
});
