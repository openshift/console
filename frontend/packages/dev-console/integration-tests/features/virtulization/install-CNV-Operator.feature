Feature: Perform actions on Virtual Machine
    As a user, I should be able to perform the actions on Virtual machine


Background: 
    Given user is at administrator perspective


@regression, @smoke
Scenario: Import Virtual Machine Card on +Add page: VM-01-TC03
    Given user has installed OpenShift Virtualization operator
    And user has created the Hyperconverged Cluster
    And user has selected namespace "aut-virtualization"
    When user switches to developer perspective
    And user navigates to Add page
    Then user will see Import Virtual Machine Card on Add page
