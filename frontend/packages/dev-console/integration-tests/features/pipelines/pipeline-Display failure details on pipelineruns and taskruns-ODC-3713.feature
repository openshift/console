Feature: Add page for Pipeline
	As a user, I want see failure details on pipelineruns and taskruns

Background:
    Given Openshift Pipeline operator is installed

@regression
Scenario: Display failure details on pipeline run details
   Given user is at pipeline page in developer perspective
   And a failed pipeline is present
   When user goes to failed pipeline run
   And user opens pipeline run details
   Then user can see status as Failure
   And user can view failure message under Message heading
   And user can see Log snippet to get know what taskruns failed

@regression
Scenario: Display failure details of pipeline run in topology sidebar
   Given user is in topology
   And a node with an associated pipeline that has failed is present
   When user opens sidebar of the node 
   And user scrolls down to pipeline runs section
   Then user will see the pipeline run name with failed status 
   And user will see failure message below pipeline runs
   And user will also see the log snippet
