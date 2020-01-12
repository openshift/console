import * as React from 'react';
import { shallow } from 'enzyme';
import ProjectAccess from '../ProjectAccess';
import ProjectListPage from '../../projects/ProjectListPage';
import { RenderProjectAccessPage } from '../RenderProjectAccessPage';

type RenderProjectAccessPageProps = React.ComponentProps<typeof RenderProjectAccessPage>;

describe('Render Project Access Page', () => {
  it('should render Project Access page', () => {
    const renderProjectAccessPageProps: RenderProjectAccessPageProps = {
      namespace: 'abc',
    };
    const renderProjectAccessPageWrapper = shallow(
      <RenderProjectAccessPage {...renderProjectAccessPageProps} />,
    );
    expect(renderProjectAccessPageWrapper.find(ProjectAccess).exists()).toBe(true);
  });

  it('should render the project list when a namespace is not selected', () => {
    const renderProjectAccessPageProps: RenderProjectAccessPageProps = {
      namespace: '',
    };
    const renderProjectAccessPageWrapper = shallow(
      <RenderProjectAccessPage {...renderProjectAccessPageProps} />,
    );
    expect(renderProjectAccessPageWrapper.find(ProjectAccess).exists()).toBe(false);
    expect(renderProjectAccessPageWrapper.find(ProjectListPage).exists()).toBe(true);
  });
});
