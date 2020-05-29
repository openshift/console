Feature: Triggers
    As a user I want to add or remove trigger details and verify the trigger for the git web hooks from pipeline

Background:
    Given user logged into the openshift application
    And openshift cluster is installed with pipeline operator
    And user is at the project namespace "AUT_MB_Demo" in dev perspecitve


@regression
Scenario Outline: Start the pipeline from trigger without secret


@regression
Scenario Outline: Start pipeline - Git reource with basic authernication type  : P-011-TC01


@regression
Scenario Outline: Start pipeline - Docker image with Image Registry Credentials : P-011-TC02


@regression
Scenario Outline: Start pipeline - Git reource with SSH  KEY : P-011-TC03