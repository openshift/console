Feature: side pane details
    As a user I want to see the details of the revision and service in side pane

Background:
    Given open shift cluster is installed with Serverless operator
    And user is on dev perspective - Topology page
    And user should be on the project "default" 
    And one service "nodejs-ex-git-1" should be available
    And one revision "nodejs-ex-git-1-q5rb8" should be available


@regression, @smoke
Scenario: Side pane display for knative Revision : Kn-05-TC01
    Given knative revision name "nodejs-ex-git-1-q5rb8" is higlighted on topology page
    When user clciks on the knative revision name "nodejs-ex-git-1-q5rb8"
    Then side pane is displayed with heading name as "nodejs-ex-git-1-q5rb8"


@regression, @smoke
Scenario: Side pane details of knative Revision : Kn-05-TC02
    Given side pane is displayed for knative revision name "nodejs-ex-git-1-q5rb8" in topology page
    Then user able to see pods status as "AutoScaled to 0" by default
    And name displays as "nodejs-ex-git-1-q5rb8"
    And namespace displays as "{Project Name}"
    And Labels section contain n number of Labels
    And Annotations section contain "{number of annotations} Annotations"
    And "Created on" field the date in format "{month date, hour:minutes am/pm}" 


Scenario: Resoruce details of kantive revision in side pane : Kn-05-TC03
   Given side pane is displayed for knative revision name "nodejs-ex-git-1-q5rb8" in topology page
   When user clicks on Resoruces section
   Then 


Scenario: links in side pane : Kn-05-TC04
    Given side pane is displayed for knative revision name "nodejs-ex-git-1-q5rb8" in topology page
    When 


@regression
Scenario: Actions menu of Kantive revision in side pane: Kn-05-TC05
   Given side pane is displayed for knative revision name "nodejs-ex-git-1-q5rb8" in topology page
   When user clicks on Actions dropdown in top right corner of side pane
   Then user able to see the options "Edit Labels", "Edit Annotations", "Edit Revision", "Delete Revision"


@regression, @smoke
Scenario: Side pane display for knative service : Kn-06-TC01
    Given knative serivce name "nodejs-ex-git-1" is higlighted on topology page
    When user clciks on the knative serivce "nodejs-ex-git-1"
    Then side pane is displayed with heading name same as kantive service name


@regression, @smoke
Scenario: Side pane details of knative Service : Kn-06-TC02
    Given knative service name "nodejs-ex-git-1" is higlighted on topology page
    When user clcik on the knative revision name "nodejs-ex-git-1"
    Then side pane is displayed with heading name as "nodejs-ex-git-1"
    And Name should display as "nodejs-ex-git-1"
    And Namespace should display as "{Project Name}"
    And Labels section should contain n number of Labels
    And Annotations section should contain "{number of annotations} Annotations"
    And "Created on" field display the date in format "{month date, hour:minutes am/pm}" 
    And owner field should be displayed


Scenario: Resoruce details of kantive service in side pane : Kn-06-TC03
   Given side pane is displayed for knative revision name "nodejs-ex-git-1-q5rb8" in topology page
   When user clicks on Resoruces section
   Then 


Scenario: links in side pane : Kn-06-TC04
    Given side pane is displayed for knative revision name "nodejs-ex-git-1-q5rb8" in topology page
    When 


@regression
Scenario: Actions menu of Kantive service in side pane: Kn-06-TC05
   Given side pane is displayed for knative revision name "nodejs-ex-git-1" in topology page
   When user clicks on Actions dropdown in top right corner of side pane
   Then user able to see the options like "Edit Application Grouping", "Set Traffic Distribution", "Edit NameOfWorkLoad", "Edit Health Checks", "Edit Labels", "Edit Annotations", "Edit Service", "Delete Service"
