import * as React from 'react';
import { connect } from 'react-redux';
import { Dropdown, DropdownItem, DropdownToggle, Title } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { LoadingInline } from '@console/internal/components/utils';
import { RootState } from '../../../redux';
import { featureReducerName } from '../../../reducers/features';
import { getActiveCluster } from '../../../reducers/ui';
import * as UIActions from '../../../actions/ui';
import { coFetchJSON } from '../../../co-fetch';

type StateProps = {
    activeCluster: string;
    setActiveCluster?: (name: string) => void;
};

export type ClusterDropdownProps = {
    onClusterSelected: () => void;
};

const ClusterDropdown_: React.FC<ClusterDropdownProps & StateProps> = ({
    setActiveCluster,
    onClusterSelected,
    activeCluster,
}) => {
    const [isClusterDropdownOpen, setClusterDropdownOpen] = React.useState(false);
    const [clusters, setClusters] = React.useState([]);

    const toggleClusterOpen = React.useCallback(() => {
        setClusterDropdownOpen(!isClusterDropdownOpen);
    }, [isClusterDropdownOpen]);

    const onClusterSelect = React.useCallback(
        (event: React.MouseEvent<HTMLLinkElement>, cluster): void => {
            event.preventDefault();

            if (cluster.name !== activeCluster) {
                setActiveCluster(cluster.name);

                // TODO: rerendering
            }

            setClusterDropdownOpen(false);
            onClusterSelected && onClusterSelected();
        },
        [activeCluster, onClusterSelected, setActiveCluster],
    );

    const renderClusterToggle = React.useCallback(
        (name: string) => name ? (
            <DropdownToggle
                isOpen={isClusterDropdownOpen}
                onToggle={toggleClusterOpen}
                iconComponent={CaretDownIcon}
                data-test-id="perspective-switcher-toggle"
            >
                <Title size="md">
                    {name.endsWith("@file") ? name.slice(0, -5) : name}
                </Title>
            </DropdownToggle>) : <LoadingInline />
        ,
        [isClusterDropdownOpen, toggleClusterOpen],
    );

    const getClusterItems = React.useCallback(
        (clusters) => {
            return clusters.map((nextCluster) => (
                <DropdownItem
                    key={nextCluster.name}
                    onClick={(event: React.MouseEvent<HTMLLinkElement>) =>
                        onClusterSelect(event, nextCluster)
                    }
                    isHovered={(nextCluster.name) === activeCluster}
                    component="button"
                >
                    <Title size="md">
                        {nextCluster.name.endsWith("@file") ? nextCluster.name.slice(0, -5) : nextCluster.name}
                    </Title>
                </DropdownItem>
            ));
        },
        [activeCluster, onClusterSelect],
    );

    React.useEffect(() => {
        if (clusters.length == 0 || isClusterDropdownOpen) {
            coFetchJSON('api/k8sAll').then((res) => {
                const clusterList: ClusterInfo[] = Object.keys(res.routers).reduce((list, currentKey) => {
                    list.push({ name: currentKey, path: res.routers[currentKey].path });
                    return list;
                }, []);

                setClusters(clusterList);

                const cluster = activeCluster && clusterList.find(c => c.name === activeCluster);

                if (!cluster) {
                    setActiveCluster("master");
                }

            });
        }
    }, [isClusterDropdownOpen]);

    return (
        <Dropdown
            isOpen={isClusterDropdownOpen}
            toggle={renderClusterToggle(activeCluster)}
            dropdownItems={getClusterItems(clusters)}
            data-test-id="perspective-switcher-menu"
        />
    );
};

const mapStateToProps = (state: RootState): StateProps => ({
    activeCluster: getActiveCluster(state),
});

export default connect<StateProps, {}, ClusterDropdownProps, RootState>(
    mapStateToProps,
    { setActiveCluster: UIActions.setActiveCluster },
    null,
    {
        areStatesEqual: (next, prev) =>
            next[featureReducerName] === prev[featureReducerName] &&
            getActiveCluster(next) === getActiveCluster(prev),
    },
)(ClusterDropdown_);

type ClusterInfo = {
    name: string;
    path: string;
};
