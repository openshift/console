Feature: Secrets
    As a user I want to add or remove secrets details to pipeline

Background:
    Given user logged into the openshift application
    And openshift cluster is installed with pipeline operator
    And user is at the project namespace "AUT_MB_Demo" in dev perspecitve


@regression, @smoke
Scenario: Add Secret details : P-011-TC01
   Given user able to see pipeline with git resources in pipeiles page
   When user selects "Start" option from kebab menu
   And clicks on Show Credentials link present in "Start Pipeline" popup
   And clicks on "+Add Secret" link
   Then user able to see Create Source Secret section
   And able to see "Secret Name", "Access to", "Server UrL" fields and authernication type sections


@regression, @smoke
Scenario: Add secret to pipeline with authentication type as Basic Authernication : P-011-TC02
   Given pipeline with git resources
   And user is at Start Pipeline popup
   When the user enters URL, Revision as "<git_private_repo_url>" and "master"
   And enters Secret Name as "<secret_name>"
   And selects the "Git Server" option from Access to drop down
   And enters the server url as "https://github.com"
   And selects the Authentication type as "Basic Authentication"
   And enters the Username, Password as "<username>", "<password>"
   And clicks on tick mark
   Then "<secret_name>" is added under secrets section

Examples:
| git_private_repo_url                    | secret_name  | username | password |
| https://github.com/sclorg/nodejs-ex.git | secret-basic | aaa      | aaa      |


@regression
Scenario Outline: Add secret to pipeline with authentication type as SSH Key : P-011-TC04   
   Given pipeline with git resources
   And user is at Start Pipeline popup
   When the user enters URL, Revision as "<git_private_repo_url>" and "master"
   And enters Secret Name as "<secret_name>"
   And selects the "Git Server" option from Access to drop down
   And enters the server url as "https://github.com"
   And selects the Authentication type as "SSH Key"
   And enters the SSH KEY as "<ssh_key>"
   And clicks on tick mark
   Then "<secret_name>" is added under secrets section

Examples:
| git_private_repo_url                    | secret_name   | ssh_key | 
| https://github.com/sclorg/nodejs-ex.git | secret-sshkey | aaa     |


@regression
Scenario Outline: Add secret to pipeline with authentication type as Image Registry Credentials : P-011-TC03
   Given pipeline with git resources
   And user is at Start Pipeline popup
   When the user enters URL, Revision as "<git_private_repo_url>" and "master"
   And enters Secret Name as "<secret_name>"
   And selects the "Git Server" option from Access to drop down
   And enters the server url as "https://github.com"
   And selects the Authentication type as "Image Registry Credentials"
   And enters the Username, Password, email as "<username>", "<password>", "<email>"
   And clicks on tick mark
   Then "<secret_name>" is added under secrets section

Examples:
| git_private_repo_url                    | secret_name  | username | password | email      | 
| https://github.com/sclorg/nodejs-ex.git | secret-image | aaa      | aaa      | aaa @a.com |