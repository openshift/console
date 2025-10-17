import { render, screen } from '@testing-library/react';
import { TaskModel, ClusterTaskModel } from '../../../../models';
import DynamicResourceLinkList from '../DynamicResourceLinkList';

describe('DynamicResourceLinkList component', () => {
  const props = {
    namespace: 'test-ns',
    title: 'Tasks',
    links: [
      { resourceKind: TaskModel.kind, name: 'namespaced-task' },
      { resourceKind: ClusterTaskModel.kind, name: 'cluster-task' },
    ],
  };

  it('should not render the children if links are empty', () => {
    render(<DynamicResourceLinkList {...props} links={[]} />);
    expect(screen.queryByText(props.title)).not.toBeInTheDocument();
  });

  it('should render resourceLinks if the links are passed', () => {
    render(<DynamicResourceLinkList {...props} />);
    expect(screen.getAllByText('namespaced-task')).toHaveLength(1);
    expect(screen.getAllByText('cluster-task')).toHaveLength(1);
  });

  it('should render proper title based on the model', () => {
    render(<DynamicResourceLinkList {...props} />);
    expect(screen.getAllByText(props.title)).toHaveLength(1);
  });
});
