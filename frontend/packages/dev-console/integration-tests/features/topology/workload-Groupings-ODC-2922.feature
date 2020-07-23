Feature: Workload Groupings in Topology 
    User will be able to expand and collapse all groups on Topology graph and list view


Background:
    Given user is at developer perspecitve


@regression, @smoke
Scenario: Default state of Display dropdown
    Given user is at the Topology page
    When user clicks on the Display dropdown
    Then user will see the Show Groups is checked
    And user will see the Expand is checked
    And user will see the Knative Services checkbox checked
    And user will see the Helm Releses checkbox checked
    And user will see the Operator Groups checkbox checked


@regression, @smoke
Scenario: Uncheck the Show Groups
    Given user is at the Topology page
    When user clicks on the Display dropdown
    And user unchecks the Show Groups
    Then user will see that the Expand and it's children are disabled
    And user will see that the group no longer appear in the view


@regression, @smoke
Scenario: Uncheck the Expand
    Given user is at Topology page
    When user clicks on the Display dropdown
    And user unchecks the Expand
    Then user will see the Knative Services checkbox is disabled
    And user will see the Helm Releses checkbox is disabled
    And user will see the Operator Groups checkbox is disabled


@regression, @smoke
Scenario: Provide ability to expand and collapse all groups in Topology graph view
    Given user is at Topology page
    And user is on the graph view
    When user clicks on the Display dropdown
    And user unchecks the Expand button 
    Then user will see the grouped resources collapsed
    And user will see the summary of workloads


@regression, @smoke
Scenario: Provide ability to expand and collapse all groups in Topology list view
    Given user is at Topology page
    And user is on the list view
    When user clicks on the Display dropdown
    And user unchecks the Expand button 
    Then user will see the grouped resources collapsed


@regression, @smoke, @manual
Scenario: Provide ability to hide and show Helm release groupings in Topology graph and list view
    Given user is at the Topology page
    And user is at the graph view
    When user clicks on the Display dropdown
    And user unchecks the Helm Release checkbox
    Then user will see the Helm releases collapsed
    And user will see the summary of workloads


@regression, @smoke, @manual
Scenario: Provide ability to hide and show Knative Services groupings in Topology graph and list view
    Given user is at the Topology page
    And user is at the graph view
    When user clicks on the Display dropdown
    And user unchecks the Knative Services checkbox
    Then user will see the Knative Services collapsed
    And user will see the summary of workloads


@regression, @smoke, @manual 
Scenario: Provide ability to hide and show Operator Groups groupings in Topology graph and list view
    Given user is at the Topology page
    And user is at the graph view
    When user clicks on the Display dropdown
    And user unchecks the Operator Groups checkbox
    Then user will see the Operator Groups collapsed
    And user will see the summary of workloads
