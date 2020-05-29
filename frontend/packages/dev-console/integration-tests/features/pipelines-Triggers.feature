Feature: Triggers
    As a user I want to add or remove trigger details and verify the trigger for the git web hooks from pipeline

Background:
    Given user logged into the openshift application
    And openshift cluster is installed with pipeline operator
    And user is at the project namespace "AUT_MB_Demo" in dev perspecitve


@regression
Scenario Outline: Add the trigger to the pipeline from pipelines page


@regression
Scenario Outline: Remove the trigger to the pipeline from pipelines page


@regression
Scenario Outline: Start the pipeline from trigger without secret


@regression
Scenario Outline: Start the pipeline from trigger with secret