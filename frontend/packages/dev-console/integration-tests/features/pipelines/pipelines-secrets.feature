@pipelines
Feature: Secrets
              As a user, I want to add or remove secrets details to pipeline

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-pipelines-secrets"
              And user is at pipelines page


        @smoke
        Scenario: Add Secrets : P-11-TC01
            Given user has created pipeline "pipe-task-resource" with git resources
              And user is at pipelines page
             When user selects "Start" option from kebab menu for pipeline "pipe-task-resource"
              And user clicks on Show Credentials link present in Start Pipeline modal
              And user clicks on "Add Secret" link
             Then user is able to see Create Source Secret section
              And user is able to see Secret Name, Access to, Server UrL fields and authentication type fields


        @smoke
        Scenario Outline: Add secret to pipeline with authentication type as Basic Authentication : P-11-TC02
            Given user has created pipeline "<pipeline_name>" with git resources
              And user is at Start Pipeline modal for pipeline "<pipeline_name>"
             When user enters URL, Revision as "<git_private_repo_url>" and "master"
              And user enters Secret Name as "<secret_name>"
              And user selects the "Git Server" option from accessTo drop down
              And user enters the server url as "https://github.com"
              And user selects the Authentication type as "Basic Authentication"
              And user enters the Username, Password as "<username>", "<password>"
              And user clicks on tick mark
             Then "<secret_name>" is added under secrets section

        Examples:
                  | pipeline_name        | git_private_repo_url                    | secret_name  | username | password |
                  | pipe-with-resource-1 | https://github.com/sclorg/nodejs-ex.git | secret-basic | aaa      | aaa      |


        @regression
        Scenario Outline: Add secret to pipeline with authentication type as SSH Key : P-11-TC04
            Given user has created pipeline "pipe-task-with-resource-2" with git resources
              And user is at Start Pipeline modal for pipeline "pipe-task-with-resource-2"
             When user enters URL, Revision as "<git_private_repo_url>" and "master"
              And user enters Secret Name as "<secret_name>"
              And user selects the "Git Server" option from accessTo drop down
              And user enters the server url as "https://github.com"
              And user selects the Authentication type as "SSH Key"
              And user enters the SSH KEY as "<ssh_key>"
              And user clicks on tick mark
             Then "<secret_name>" is added under secrets section

        Examples:
                  | git_private_repo_url                    | secret_name   | ssh_key |
                  | https://github.com/sclorg/nodejs-ex.git | secret-sshkey | aaa     |


        @regression
        Scenario Outline: Add secret to pipeline with authentication type as Image Registry Credentials : P-11-TC03
            Given user has created pipeline "pipe-task-with-resource-3" with git resources
              And user is at Start Pipeline modal for pipeline "pipe-task-with-resource-3"
             When user enters URL, Revision as "<git_private_repo_url>" and "master"
              And user enters Secret Name as "<secret_name>"
              And user selects the "Git Server" option from accessTo drop down
              And user enters the server url as "https://github.com"
              And user selects the Authentication type as "Image Registry Credentials"
              And user enters the Username, Password, email as "<username>", "<password>", "<email>"
              And user clicks on tick mark
             Then "<secret_name>" is added under secrets section

        Examples:
                  | git_private_repo_url                    | secret_name  | username | password | email      |
                  | https://github.com/sclorg/nodejs-ex.git | secret-image | aaa      | aaa      | aaa @a.com |
