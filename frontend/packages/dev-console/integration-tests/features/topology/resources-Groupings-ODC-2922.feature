Feature: Resources Groupings in Topology 
    User will be able to show and hide all types of resources on Topology graph and list view


Background:
    Given user is at developer perspecitve


@regression, @smoke
Scenario: Default state of Resources dropdown
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    Then user sees that all the checkboxes are unchecked


@regression, @smoke, @manual
Scenario: Ability to show Deployment resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks Deployments checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the workloads of Deployments resource types only


@regression, @smoke, @manual
Scenario: Ability to hide Deployment resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks all checkboxes
    And user unchecks Deployments checkbox
    Then user will not see the workloads of Deployments resource types only


@regression, @smoke, @manual
Scenario: Ability to show Deployment Config resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks Deployment Configs checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the workloads of Deployment Configs resource types only


@regression, @smoke, @manual
Scenario: Ability to hide Deployment Config resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks all checkboxes
    And user unchecks Deployment Configs checkbox
    Then user will not see the workloads of Deployment Configs resource types only


@regression, @smoke, @manual
Scenario: Ability to show Virtual Machines resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks Virtual Machines checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the workloads of Virtual Machines resource types only


@regression, @smoke, @manual
Scenario: Ability to hide Virtual Machines resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks all checkboxes
    And user unchecks Virtual Machines checkbox
    Then user will not see the workloads of Virtual Machines resource types only


@regression, @smoke, @manual
Scenario: Ability to show Event Sources resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks Event Sources checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the workloads of Event Sources resource types only


@regression, @smoke, @manual
Scenario: Ability to hide Event Sources resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks all checkboxes
    And user unchecks Event Sources checkbox
    Then user will not see the workloads of Event Sources resource types only


@regression, @smoke, @manual
Scenario: Ability to show Helm Releases resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks Helm Releases checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the workloads of Helm Releases resource types only


@regression, @smoke, @manual
Scenario: Ability to hide Helm Releases resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks all checkboxes
    And user unchecks Helm Releases checkbox
    Then user will not see the workloads of Helm Releases resource types only


@regression, @smoke, @manual
Scenario: Ability to show Knative Services resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks Knative Services checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the Knative Services resource types only


@regression, @smoke, @manual
Scenario: Ability to hide Knative Services resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks all checkboxes
    And user unchecks Knative Services checkbox
    Then user will not see the Knative Services resource types only


@regression, @smoke, @manual
Scenario: Ability to show Stateful Set resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks Stateful Set checkbox
    And user unchecks other checkboxes if there are any
    Then user will see the workloads of  Stateful Set resource types only


@regression, @smoke, @manual
Scenario: Ability to hide Stateful Set resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user checks all checkboxes
    And user unchecks Stateful Set checkbox
    Then user will not see the workloads of Stateful Set resource types only


@regression, @smoke, @manual
Scenario: Ability to selects all resource types in Topology graph and list view
    Given user is at Topology page
    When user clicks on the Resources dropdown 
    And user clicks on the Select All button
    Then user will see workloads of all resource types
