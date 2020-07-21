Feature: Changing context in Monitoring Dashboard
	User should be able to change the filter in the Monitoring Dashboard

Background:
    Given user logged into the openshift application
    And user is at the developer perspective

@regression
Scenario: Checking filter dropdown for specific workload on Monitoring Dashboard navigating from workloads
    Given user is in topology view with workloads
    When user clicks monitoring dashboard from the sidebar of workload
    And user checks filter dropdown will be autopopulated with the selected workload in monitoring page
    And user clicks on dropdown
    And user selects one workload
    Then user checks for charts of the workload

@regression
Scenario: Checking filter dropdown for all workloads on Monitoring Dashboard navigating from workloads
    Given user is in topology view with workloads
    When user clicks monitoring dashboard from the sidebar of workload
    And user checks filter dropdown will be autopopulated with the selected workload in monitoring page
    And user clicks on dropdown
    And user selects "All Workloads"
    Then user checks for charts of the all the workload present in the namespace

@regression
Scenario: Checking filter dropdown for workloads on Monitoring Dashboard navigating from nav bar
    Given user is at the Monitoring dashboard
    When user clicks on filter dropdown
    And user checks filter dropdown will be autopopulated with "All Workloads"
    And user selects one workload
    Then user checks for charts of the workload

@regression
Scenario: Checking filter dropdown for workloads on Monitoring Dashboard on refresh
    Given user is at the Monitoring dashboard
    When user clicks on filter dropdown
    And user selects one workload from the list
    And user refreshes the page
    Then the page will auto select the previously selected workload

@regression
Scenario: Checking filter dropdown for workloads on Monitoring Dashboard on project change
    Given user is at the Monitoring dashboard
    When user clicks on filter dropdown
    And user selects one workload from the list
    And user switches to a different project from project selector 
    Then filter dropdown option will be set to "All workloads"
