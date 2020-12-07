Feature: Creation of Kamelets via Event Source Creation
    As a user, I should be able to install and use more camel connectors


    Background:
        Given user has installed OpenShift Serverless Operator
        And user has created Knative Serving and Knative Eventing CR
        And user has installed Red Hat Integration - Camel K Operator
        And user has created Integration Platform CR
        And user has selected "aut-test-kamelets" namespace


    @regression
    Scenario: Kamelets on Event Sources page
        Given user is at Developer Catalog page
        When user clicks on Event Sources
        Then user will see cards of AWS Kinesis Source, AWS SQS Source, Jira Source, Salesforce Source, Slack Source, Telegram Source
