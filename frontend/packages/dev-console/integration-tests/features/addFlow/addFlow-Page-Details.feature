Feature: Create Application from git form
    As a user I want to create the application, component or service from Add options

Background:
    Given user logged into the openshift application
    And user is on dev perspecitve


@regression
Scenario: On no workload, add page displays with message "No workloads found" : A-01-TC01
   Given user is on new project namespace "AUT_AddFlow_Demo"
   When user selects Add option from left side navigation menu
   Then user redirects to page with header name "Add"
   And message displays as "No workloads found"


@regression, @smoke
Scenario: Display of workloads when no operator is installed : A-01-TC02
   Given cluster is not installed with any operators
   When user selects Add option from left side navigation men
   Then user redirects to page with header name "Add"
   And page contains From Git, Container Image, From Dockerfile, YAML, From Catalog, Database, Helm Chart cards 


@regression
Scenario:  Pipeline card display on pipeline operator installation : A-02-TC01
   Given cluster is installed with pipeline operator
   When user selects Add option from left side navigation menu
   Then user redirects to page with header name "Add"
   And page contains Pipeline card


@regression
Scenario:  Operator Backed card display on serverless operator installation : A-02-TC01
   Given cluster is installed with serverless operator
   When user selects Add option from left side navigation menu
   Then user redirects to page with header name "Add"
   And page contains Operator Backed card
