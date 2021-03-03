@knative-eventing @regression
Feature: Creation of Kamelets via Event Source Creation
              As a user, I should be able to install and use more camel connectors


        Scenario: Kamelets on Event Sources page
            Given user has created Knative Serving and Knative Eventing CR
              And user has installed Red Hat Integration - Camel K Operator
              And user has created Integration Platform CR
              And user has created or selected "aut-test-kamelets" namespace
              And user is at Developer Catalog page
             When user clicks on Event Sources
             Then user will see cards of AWS Kinesis Source, AWS SQS Source, Jira Source, Salesforce Source, Slack Source, Telegram Source
