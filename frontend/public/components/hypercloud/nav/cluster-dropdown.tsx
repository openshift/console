import * as React from 'react';
import { connect } from 'react-redux';
import { Dropdown, DropdownItem, DropdownToggle, Title } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { LoadingInline } from '@console/internal/components/utils';
import { RootState } from '../../../redux';
import { featureReducerName } from '../../../reducers/features';
import { getActiveCluster } from '../../../reducers/ui';
import * as UIActions from '../../../actions/ui';
import { ClusterManagerModel } from '../../../models';
import { k8sList } from '../../../module/k8s/resource'

const clusterModel = ClusterManagerModel;

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
    const [clusters, setClusters] = React.useState(new Set<string>([]));

    const toggleClusterOpen = React.useCallback(() => {
        setClusterDropdownOpen(!isClusterDropdownOpen);
    }, [isClusterDropdownOpen]);

    const onClusterSelect = React.useCallback(
        (event: React.MouseEvent<HTMLLinkElement>, cluster): void => {
            event.preventDefault();

            if (cluster !== activeCluster) {
                setActiveCluster(cluster);
                window.location.reload()
                // TODO: rerendering 고도화...
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
                    {name}
                </Title>
            </DropdownToggle>) : <LoadingInline />
        ,
        [isClusterDropdownOpen, toggleClusterOpen],
    );

    const getClusterItems = React.useCallback(
        (clusters) => {
            let clusterItmes = [];
            clusters.forEach((nextCluster) => (
                clusterItmes.push(
                    <DropdownItem
                        key={nextCluster}
                        onClick={(event: React.MouseEvent<HTMLLinkElement>) =>
                            onClusterSelect(event, nextCluster)
                        }
                        isHovered={(nextCluster) === activeCluster}
                        component="button"
                    >
                        <Title size="md">
                            {nextCluster}
                        </Title>
                    </DropdownItem>
                )
            ));
            return clusterItmes;
        },
        [activeCluster, onClusterSelect],
    );

    React.useEffect(() => {
        if (clusters.size == 0 || isClusterDropdownOpen) {
            k8sList(clusterModel).then((res) => {
                const clusterList: Set<string> = new Set(res.reduce((list, cluster)=> {
                    if(cluster.status.ready) {
                        list.push(cluster.metadata.name);
                    }
                    return list;
                }, []));
                clusterList.add('master');
              
                setClusters(clusterList);

                const hasCluster = activeCluster && clusterList.has(activeCluster);

                if (!hasCluster) {
                    const defaultCluster = clusterList.has('master') ? 'master' : clusterList[0];
                    setActiveCluster(defaultCluster);
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
