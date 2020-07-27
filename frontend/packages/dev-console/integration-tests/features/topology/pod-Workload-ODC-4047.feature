Feature: Topology 
    User will be able to create the pod and will be able to see it on Topology page


Background:
    Given user logged into the openshift application


@regression
Scenario: Create Pod type workload
    Given user is at the Administrator perspective
    When user clicks on the Workloads tab
    And user clicks on the Pods item
    And user clicks on the Create Pod button
    And user clicks on the Create button to create new pod
    Then user will be redirected to the details page of newly created pod


@regression
Scenario: Pod type workload on Topology page
    Given user is at developer perspective
    And user is on Topology page
    Then user will see the newly created pod


@regression
Scenario: Sidebar for the Pod
    Given user is on Topology page
    When user clicks on the pod type workload
    Then user will see the resource tab
    And user will see the details tab
