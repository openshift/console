Feature: Topology 
    User will be able to create the job and will be able to see it on Topology page


Background:
    Given user logged into the openshift application


@regression, @smoke
Scenario: Create Job type workload
    Given user is at Administrator perspective
    When user clicks on the Workloads tab
    And user clicks on the Jobs item
    And user clicks on the Create Job button
    And user clicks on the Create button to create new job
    Then user will be redirected to the details page of newly created job


@regression, @smoke
Scenario: Job type workload on Topology graph view
    Given user is at developer perspective
    And user is on Topology page
    Then user will see the newly created job


@regression, @smoke
Scenario: Job type workload on Topology list view
    Given user is at developer perspective
    And user is on Topology page
    And user switches to list view
    Then user will see the newly created job


@regression, @smoke
Scenario: Sidebar for the Job
    Given user is on Topology page
    When user clicks on the job type workload
    Then user will see the resource tab
    And user will see the details tab
