Feature: Create workload from Operator Backed file
    As a user, I want to create the application, component or service from Developer Catlog Operator backed file

Background:
    Given user has installed OpenShift Serverless Operator
    And user is at developer perspecitve
    And user is at Add page
    And user has selected namespace "knative-serving"


@regression, @smoke-1
Scenario: Create the workload from Operator Backed : A-08-TC01
    Given user is at Developer Catlog page
    And Opeator Backed is selected on Developer Catalog page
    When user selects knative Serving card
    And user clicks Create button in side bar
    And user enters name as "knative-serving-1" in Create Knative Serving page
    And user clicks create button in Create Knative Serving page
    Then user will be redirected to Topology page
    And user is able to see workload "knative-serving-1" in topology page


@regression, @smoke-1
Scenario: Perform cancel operation : A-08-TC02
    Given user is at Developer Catlog page
    And Opeator Backed is selected on Developer Catalog page
    When user selects knative Serving card
    And user clicks Create button in side bar
    And user clicks cancel button in Create Knative Serving page
    Then user will be redirected to Add page
