Feature: Install OpenShift Virtualization Operator
    User should be able to install the OpenShift Virtualization Operator


Background: 
    Given user is at Administrator perspective


@smoke, @regression
Scenario: Install OpenShift Virtualization Operator: VM-01-TC01
    Given user is at Administrator perspective
    When user goes to OperatorHub page
    And user searched for OpenShift Virtualization Operator
    And user clicks on the OpenShift Virtualization Operator card
    And user clicks on Install button
    And user clicks on Install button on the Install Operator page
    Then user will see a modal saying OpenShift Virtualization Operator is installed
    And user will see a View Operator button


@regression
Scenario: Create HyperConverged Cluster: VM-01-TC02
    Given user is at Installed Operator page
    When user clicks on OpenShift Virtualization Operator
    And user clicks on CNV Operator Deployment tab
    And user clicks on the Create HyperConverged Cluster button
    And user clicks on Create button
    Then user will see a HyperConverged Cluster created
    And user will see Virtualization item under Workloads


@smoke, @regression
Scenario: Import Virtual Machine Card on +Add page: VM-01-TC03
    Given user is at Developer perspective
    When user goes to +Add page
    Then user will see Import Virtual Machine Card on +Add page
