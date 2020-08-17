Feature: Install OpenShift Virtualization Operator
    User should be able to install the OpenShift Virtualization Operator


Background: 
    Given user is in administratr perspective


@smoke, @regression
Scenario: Install OpenShift Virtualization Operator: VM-01-TC01
    Given open project namespace "openshift-cnv"
    And user is at Operator Hub page with the header name "OperatorHub"
    When user searches for "OpenShift Virtualization"
    And clicks on the OpenShift Virtualization Operator card
    And click install button present on the right side pane
    And user installs the OpenShift Virtualization operator with default values
    Then user will see a modal with title "OpenShift Virtualization"
    And user will see a View Operator button


@regression
Scenario: Create HyperConverged Cluster: VM-01-TC02
    Given open project namespace "openshift-cnv"
    And user is at Installed Operator page
    When user clicks on OpenShift Virtualization Operator
    And user clicks on CNV Operator Deployment tab
    And user clicks on the Create HyperConverged Cluster button
    And user clicks on Create button
    Then user will see a HyperConverged Cluster created
    And user will see Virtualization item under Workloads


@smoke, @regression
Scenario: Import Virtual Machine Card on +Add page: VM-01-TC03
    Given user is at Developer Perspective
    When user navigates to Add page
    Then user will see Import Virtual Machine Card on Add page
