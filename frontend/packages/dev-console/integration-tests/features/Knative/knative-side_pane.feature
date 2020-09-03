Feature: side bar details
    As a user I want to see the details of the revision and service in side bar

Background:
    Given open shift cluster is installed with Serverless operator
    And user is at developer perspecitve
    And user has selected namespace "aut-knative-side-pane-details"


@regression, @smoke
Scenario: side bar display for knative service : Kn-06-TC01
    Given knative service named "nodejs-ex-git-1" is higlighted on topology page
    When user clicks on the knative serivce "nodejs-ex-git-1"
    Then side bar is displayed with heading name same as kantive service name "nodejs-ex-git-1"


@regression, @smoke
Scenario: side bar details of knative Service : Kn-06-TC02
    Given knative service named "nodejs-ex-git-1" is higlighted on topology page
    When user clicks on the knative service name "nodejs-ex-git-1"
    Then side bar is displayed with heading name as "nodejs-ex-git-1"
    And Name, Namespace, Labels, Annotations, Created on, Owner fields displayed  in topology details
    # And Name display as "nodejs-ex-git-1" in topology details
    # And Namespace display as "aut-knative-side-pane-details" in topology details
    # And Labels section contain n number of Labels in topology details
    # And Annotations section contain "{number of annotations} Annotations" in topology details
    # And "Created on" field display the date in format "{month date, hour:minutes am/pm}" in topology details
    # And owner field displayed in topology details


@regression, @smoke
Scenario: side bar details of for knative Revision : Kn-05-TC01, Kn-05-TC02
    Given knative service named "nodejs-ex-git-1" is higlighted on topology page
    When user clicks on the revision of knative service "nodejs-ex-git-1"
    Then side bar is displayed
    And Name, Namespace, Labels, Annotations, Created on, Owner fields displayed  in topology details


@regression, @smoke
Scenario: side bar details of knative Revision : Kn-05-TC02
    Given side bar is displayed for revision of kantive service "nodejs-ex-git-1" in topology page
    Then user able to see pods status as "AutoScaled to 0" by default
    # And name displays as "nodejs-ex-git-1-q5rb8"
    # And namespace displays as "{Project Name}"
    # And Labels section contain n number of Labels
    # And Annotations section contain "{number of annotations} Annotations"
    # And "Created on" field the date in format "{month date, hour:minutes am/pm}" 


Scenario: Resoruce details of kantive revision in side bar : Kn-05-TC03
   Given side bar is displayed for knative revision name "nodejs-ex-git-1-q5rb8" in topology page
   When user clicks on Resoruces section


Scenario: links in side bar : Kn-05-TC04
    Given side bar is displayed for knative revision name "nodejs-ex-git-1-q5rb8" in topology page


@regression
Scenario: Actions menu of Kantive revision in side bar: Kn-05-TC05
   Given side bar is displayed for knative revision name "nodejs-ex-git-1-q5rb8" in topology page
   When user clicks on Actions dropdown in top right corner of side bar
   Then user able to see the options Edit Labels, Edit Annotations, Edit Revision, Delete Revision


Scenario: Resoruce details of kantive service in side bar : Kn-06-TC03
   Given side bar is displayed for knative revision name "nodejs-ex-git-1-q5rb8" in topology page
   When user clicks on Resoruces section


Scenario: links in side bar : Kn-06-TC04
    Given side bar is displayed for knative revision name "nodejs-ex-git-1-q5rb8" in topology page


@regression
Scenario: Actions menu of Kantive service in side bar: Kn-06-TC05
   Given side bar is displayed for knative revision name "nodejs-ex-git-1" in topology page
   When user clicks on Actions dropdown in top right corner of side bar
   Then user able to see the options like Edit Application Grouping, Set Traffic Distribution, Edit NameOfWorkLoad, Edit Health Checks, Edit Labels, Edit Annotations, Edit Service, Delete Service
