import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { connect } from 'react-redux';
import { ResourceDropdownField } from '@console/shared';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { getActiveNamespace } from '@console/internal/reducers/ui-selectors';
import { RootState } from '@console/internal/redux-types';
import './PVCDropdown.scss';

interface PVCDropdownProps {
  name: string;
}

interface StateProps {
  namespace: string;
}

const PVCDropdown: React.FC<PVCDropdownProps & StateProps> = ({ name, namespace }) => {
  const autocompleteFilter = (strText, item): boolean => fuzzy(strText, item?.props?.name);
  const resources = [
    {
      isList: true,
      kind: PersistentVolumeClaimModel.kind,
      namespace,
      prop: PersistentVolumeClaimModel.id,
      optional: true,
    },
  ];
  return (
    <ResourceDropdownField
      name={name}
      className="odc-pvc-dropdown"
      resources={resources}
      dataSelector={['metadata', 'name']}
      placeholder="Select a PVC"
      autocompleteFilter={autocompleteFilter}
      fullWidth
      showBadge
    />
  );
};

const mapStateToProps = (state: RootState): StateProps => ({
  namespace: getActiveNamespace(state),
});

export default connect<StateProps, null, PVCDropdownProps>(mapStateToProps)(PVCDropdown);
