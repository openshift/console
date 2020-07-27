Feature: Topology 
    User will be able to create the cron job and will be able to see it on Topology page


Background:
    Given user logged into the openshift application


@regression
Scenario: Create Cron Job type workload
    Given user is at the Administrator perspective
    When user clicks on the Workloads tab
    And user clicks on the Cron Jobs item
    And user clicks on the Create Cron Job button
    And user clicks on the Create button to create new cron job
    Then user will be redirected to the details page of newly created cron job


@regression
Scenario: Cron Job type workload on Topology graph view
    Given user is at developer perspective
    And user is on Topology page
    Then user will see the newly created cron job


@regression
Scenario: Cron Job type workload on Topology list view
    Given user is at developer perspective
    And user is on Topology page
    And user switches to list view
    Then user will see the newly created cron job


@regression
Scenario: Sidebar for the Cron Job
    Given user is on Topology page
    When user clicks on the cron job type workload
    Then user will see the resource tab
    And user will see the details tab
