Feature: Login to Application

    As a valid user
    I want to log in to the Application

    @smoke
    Scenario Outline: Valid Login
        Given user open the login Page
        When user enter a username "<userName>"
        And user enter a password "<password>"
        And user click the sign-in button
        Then user should be able to login

Examples:
| userName   | password                |
| kubeadmin  | uMRpJ-NFVxs-qi4vZ-XpnXk |


    Scenario Outline: Invalid Login
        Given user open the login Page
        When user enter a username "<userName>"
        And user enter a password "<password>"
        And user click the sign-in button
        Then error should displayed as "<error_message>"

Examples:
| userName   | password                 | error_message                                |
| kubeadmin  | xM3si-ii9Gn-AFku2-edeMb  | Invalid login or password. Please try again. |
|     a      | xM3si-ii9Gn-AFku2-edeMb  | Invalid login or password. Please try again. |
| kubeadmin  |            a             | An authentication error occurred.            |
