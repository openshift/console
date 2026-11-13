import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StorageClassModel, VolumeGroupSnapshotClassModel } from '@console/internal/models';
import { k8sCreate } from '@console/internal/module/k8s';
import type {
  PersistentVolumeClaimKind,
  StorageClassResourceKind,
  VolumeGroupSnapshotClassKind,
  VolumeGroupSnapshotKind,
} from '@console/internal/module/k8s';
import { VolumeGroupSnapshot } from '../create-volume-group-snapshot';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

jest.mock('@console/internal/module/k8s', () => ({
  k8sCreate: jest.fn(),
  apiVersionForModel: jest.fn(() => 'groupsnapshot.storage.k8s.io/v1'),
  referenceForModel: jest.fn(() => 'groupsnapshot.storage.k8s.io~v1~VolumeGroupSnapshot'),
  referenceFor: jest.fn(() => 'groupsnapshot.storage.k8s.io~v1~VolumeGroupSnapshot'),
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: ({ title }: { title: string }) => title,
}));

jest.mock('@console/internal/components/utils/resource-link', () => ({
  resourceObjPath: jest.fn(
    () => '/k8s/ns/test-ns/groupsnapshot.storage.k8s.io~v1~VolumeGroupSnapshot/group-snapshot',
  ),
}));

jest.mock('@console/internal/components/utils/button-bar', () => ({
  ButtonBar: ({ children, errorMessage }: { children: ReactNode; errorMessage?: ReactNode }) => (
    <>
      {errorMessage}
      {children}
    </>
  ),
}));

jest.mock('@console/internal/components/utils/list-dropdown', () => ({
  ListDropdown: ({
    selectedKey,
    onChange,
  }: {
    selectedKey: string;
    onChange: (key: string) => void;
  }) => (
    <div>
      <span data-test="selected-vgsc">{selectedKey}</span>
      <button type="button" onClick={() => onChange('compatible-class-a')}>
        choose compatible-class-a
      </button>
      <button type="button" onClick={() => onChange('incompatible-class')}>
        choose incompatible-class
      </button>
    </div>
  ),
}));

jest.mock('../pvc-table', () => ({
  PVCTable: ({ setSelectorTags }: { setSelectorTags: (tags: string[]) => void }) => (
    <button type="button" onClick={() => setSelectorTags(['vgs-select=true'])}>
      select PVCs
    </button>
  ),
}));

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const useNavigateMock = jest.requireMock('react-router').useNavigate as jest.Mock;
const useParamsMock = jest.requireMock('react-router').useParams as jest.Mock;
const k8sCreateMock = k8sCreate as jest.Mock;

const pvc = (name: string, storageClassName: string): PersistentVolumeClaimKind =>
  ({
    metadata: { uid: name, name },
    spec: { storageClassName },
  }) as PersistentVolumeClaimKind;

const storageClass = (name: string, provisioner: string): StorageClassResourceKind =>
  ({ metadata: { name }, provisioner }) as StorageClassResourceKind;

const vgsClass = (
  name: string,
  driver: string,
  isDefault?: boolean,
): VolumeGroupSnapshotClassKind =>
  ({
    metadata: {
      name,
      annotations: isDefault
        ? { 'groupsnapshot.storage.kubernetes.io/is-default-class': 'true' }
        : {},
    },
    driver,
  }) as VolumeGroupSnapshotClassKind;

const storageClasses = [
  storageClass('sc-a', 'driver.example.com'),
  storageClass('sc-b', 'driver.example.com'),
  storageClass('sc-c', 'other-driver.example.com'),
  // Provisioner deliberately contains 'driver.example.com' as a substring, to catch a
  // vgsClassFilter that uses String.includes instead of exact equality.
  storageClass('sc-d', 'csi.driver.example.com'),
];

const vgsClasses = [
  vgsClass('compatible-class-a', 'driver.example.com'),
  vgsClass('compatible-class-b', 'driver.example.com', true),
  vgsClass('incompatible-class', 'other-driver.example.com'),
];

const singleProvisionerPVCs = [pvc('pvc-1', 'sc-a'), pvc('pvc-2', 'sc-b')];
const mixedProvisionerPVCs = [pvc('pvc-1', 'sc-a'), pvc('pvc-2', 'sc-c')];
const substringProvisionerPVCs = [pvc('pvc-1', 'sc-d')];

const setup = (pvcs: PersistentVolumeClaimKind[]) => {
  useK8sWatchResourceMock.mockImplementation(
    (resource: { kind?: string; groupVersionKind?: { kind: string } }) => {
      if (resource?.kind === StorageClassModel.kind) {
        return [storageClasses, true, undefined];
      }
      if (resource?.groupVersionKind?.kind === VolumeGroupSnapshotClassModel.kind) {
        return [vgsClasses, true, undefined];
      }
      return [pvcs, true, undefined];
    },
  );
  render(<VolumeGroupSnapshot />);
};

describe('CreateGroupSnapshotForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParamsMock.mockReturnValue({ ns: 'test-ns' });
    useNavigateMock.mockReturnValue(jest.fn());
  });

  it('should select the default-flagged VolumeGroupSnapshotClass compatible with the matched PVCs provisioner', async () => {
    const user = userEvent.setup();
    setup(singleProvisionerPVCs);

    await user.click(screen.getByRole('button', { name: 'select PVCs' }));

    expect(screen.getByTestId('selected-vgsc')).toHaveTextContent('compatible-class-b');
  });

  it('should keep an explicit compatible class selection instead of reverting to the default', async () => {
    const user = userEvent.setup();
    setup(singleProvisionerPVCs);

    await user.click(screen.getByRole('button', { name: 'select PVCs' }));
    await user.click(screen.getByRole('button', { name: 'choose compatible-class-a' }));

    expect(screen.getByTestId('selected-vgsc')).toHaveTextContent('compatible-class-a');
  });

  it('should fall back to a compatible class when the user picks one with a different provisioner', async () => {
    const user = userEvent.setup();
    setup(singleProvisionerPVCs);

    await user.click(screen.getByRole('button', { name: 'select PVCs' }));
    await user.click(screen.getByRole('button', { name: 'choose incompatible-class' }));

    expect(screen.getByTestId('selected-vgsc')).toHaveTextContent('compatible-class-b');
  });

  it('should not offer a class whose driver is only a substring of the matched provisioner', async () => {
    const user = userEvent.setup();
    setup(substringProvisionerPVCs);

    await user.click(screen.getByRole('button', { name: 'select PVCs' }));

    expect(screen.getByTestId('selected-vgsc')).toBeEmptyDOMElement();
  });

  it('should show a validation error and disable Create when matched PVCs have different provisioners', async () => {
    const user = userEvent.setup();
    setup(mixedProvisionerPVCs);

    await user.click(screen.getByRole('button', { name: 'select PVCs' }));

    expect(
      screen.getByText(
        'Selected PVCs have different storage provisioners. All PVCs must have StorageClasses with the same provisioner.',
      ),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('should not show a validation error when no PVCs have been selected yet', () => {
    setup(mixedProvisionerPVCs);

    expect(
      screen.queryByText(
        'Selected PVCs have different storage provisioners. All PVCs must have StorageClasses with the same provisioner.',
      ),
    ).not.toBeInTheDocument();
  });

  it('should disable Create when the name field is cleared even though PVCs and class are valid', async () => {
    const user = userEvent.setup();
    setup(singleProvisionerPVCs);

    await user.click(screen.getByRole('button', { name: 'select PVCs' }));
    await user.clear(screen.getByLabelText(/Name/));

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('should enable Create once a name, class, and single-provisioner PVCs are set', async () => {
    const user = userEvent.setup();
    setup(singleProvisionerPVCs);

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'select PVCs' }));

    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  it('should create the VolumeGroupSnapshot with a matchLabels selector, never matchExpressions', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    k8sCreateMock.mockResolvedValue({
      metadata: { name: 'group-snapshot', namespace: 'test-ns' },
    } as VolumeGroupSnapshotKind);
    setup(singleProvisionerPVCs);

    await user.click(screen.getByRole('button', { name: 'select PVCs' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(k8sCreateMock).toHaveBeenCalledTimes(1);
    const [, submittedResource] = k8sCreateMock.mock.calls[0];
    expect(submittedResource.spec.source.selector).toStrictEqual({
      matchLabels: { 'vgs-select': 'true' },
    });
    expect(submittedResource.spec.source.selector.matchExpressions).toBeUndefined();
  });
});
