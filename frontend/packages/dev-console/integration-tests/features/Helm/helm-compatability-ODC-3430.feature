Feature: Helm Chart
    User will be able to update the chart versions or values config of a helm release


Background:
    Given user logged into the openshift application
    And user is at developer perspecitve


@regression, @smoke, @manual
Scenario: Compatible helm charts
    Given user is at +Add page
    When user clicks on the Helm Chart card on the +Add page
    Then user sees the helm charts compatible with the kubernetes version of the cluster on the developer catalog page


@regression, @smoke, @manual
Scenario: Check the meta data for the importing helm charts from index.yaml
    Given user is at +Add page
    When user opens the Network tab
    And user clicks on the Helm Chart card on the +Add page
    And user clicks on the index.yaml on the Network tab
    Then user sees that the kubeversion of each chart is either equal to or less than the kubeversion of cluster


@regression, @smoke, @manual
Scenario: Check the chart versions in the chart version dropdown if they are compatible with the cluster
    Given user is at the Install Helm Chart page
    When user clicks on the Chart Version dropdown menu
    Then user will see the chart versions which are compatible with the kubeversion of the cluster
