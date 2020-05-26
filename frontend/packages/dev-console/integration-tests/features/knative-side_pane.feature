Feature: side pane details
    As a user I want to see the details of the revision and service in side pane

Background:
    Given open shift cluster is installed with Serverless operator
    And user is on dev perspective - Topology page
    And user should be on the project "default" 
    And one service "nodejs-ex-git-1" should be available
    And one revision "nodejs-ex-git-1-q5rb8" should be available

Scenario: Verify the revision details in side pane 
    Given searched results are displayed with knative revision name "nodejs-ex-git-1-q5rb8"
    When user clcik on the knative revision name "nodejs-ex-git-1-q5rb8"
    Then side pane is displayed with heading name as "nodejs-ex-git-1-q5rb8"
    And pods status displays as "AutoScaled to 0" by default
    And Name should display as "nodejs-ex-git-1-q5rb8"
    And Namespace should display as "{Project Name}"
    And Labels section should contain n number of Labels
    And Annotations section should contain "{number of annotations} Annotations"
    And "Created on" field display the date in format "{month date, hour:minutes am/pm}" 
    And owner field should be displayed

Scenario: Verify the revision resources in side pane


Scenario: view the service details in side pane
    Given searched results are displayed with knative revision name "nodejs-ex-git-1"
    When user clcik on the knative revision name "nodejs-ex-git-1"
    Then side pane is displayed with heading name as "nodejs-ex-git-1"
    And Name should display as "nodejs-ex-git-1"
    And Namespace should display as "{Project Name}"
    And Labels section should contain n number of Labels
    And Annotations section should contain "{number of annotations} Annotations"
    And "Created on" field display the date in format "{month date, hour:minutes am/pm}" 
    And owner field should be displayed

Scenario: Verify the service resources in side pane

