@guided-tour @regression
Feature: Build your guided documentation card in developer console
              As a user, I want to view Quick Starts card in Add page

        Background:
            Given user is at developer perspective
              And sample-application CR Quick Start is available
              And add-healthchecks CR Quick Start is available
              And explore-serverless CR Quick Start is available
              And explore-pipeline CR Quick Start is available


        @to-do
        Scenario: Build your guided documentation card on +Add page: QS-03-TC01
            Given user is in developer perspective
             When user goes to +Add page
             Then user can see Build your guided documentation card
              And user can see two Quick Starts link present on it
              And user can see the "View all quick starts" on the card


        @to-do
        Scenario: Quick Starts page when no tour has started: QS-03-TC02
            Given user is in developer perspective
             When user goes to +Add page
              And user clicks on the "View all quick starts" on Build your guided documentation card
             Then user can see "Get started with a sample application", "Install the OpenShift Pipelines Operator", "Install the OpenShift Pipelines Operator" and "Add health checks to your sample application" Quick Starts
              And user can see time taken to complete the tour on the card


        @to-do
        Scenario: Quick Starts page when tour has completed: QS-03-TC03
            Given user is in developer perspective
              And user has completed "Get started with a sample application" Quick Start
             When user goes to +Add page
              And user clicks on the "View all quick starts" on Build your guided documentation card
             Then user can see "Get started with a sample application" Quick Start card
              And user can see time taken to complete the tour on the card
              And user can see Complete label


        @to-do
        Scenario: Quick tour page when tour is not completed: QS-03-TC04
            Given user is in developer perspective
              And user has not completed "Get started with a sample application" Quick Start
             When user goes to +Add page
              And user clicks on the "View all quick starts" on Build your guided documentation card
             Then user can see "Get started with a sample application" Quick Start card
              And user can see time taken to complete the tour on the card
              And user can see In Progress label


        @to-do
        Scenario: Remove quick tour card from +Add view: QS-03-TC05
            Given user is in developer perspective
             When user goes to +Add page
              And user clicks on the kebab menu in the Getting started resources card
              And user clicks on Hide from view
             Then Build your guided documentation card will be removed from +Add page


        @to-do
        Scenario: Quick Starts card links with status as in progress: QS-03-TC06
            Given user is at +Add page
             When user clicks on first Quick Starts link on the Build your guided documentation card
              And user clicks on the Start button
              And user clicks on close button
              And user clicks on Leave on Leave the tour modal box
             Then user can see the first Quick Starts link


        @to-do
        Scenario: Quick Starts card when all Quick Starts has completed: QS-03-TC07
            Given user is at +Add page
             When user completes all the Quick Starts present
             Then user can see Build your guided documentation card is removed from the +Add page


        @odc-5010 @to-do
        Scenario: Visiting a Quick Start tour: QS-03-TC08
            Given user is at Quick Start card page
             When user clicks "Get started with a sample application" Quick Start card
              And user Starts button
              And user clicks on Next button in Step 1
              And user selects Yes in Check your Work section
              And user clicks on Next button in Step 2
              And user selects Yes in Check your Work section
              And user clicks on Next button in Step 3
              And user selects Yes in Check your Work section
              And user clicks on Next button in Step 4
              And user selects Yes in Check your Work section
              And user clicks on Next button in Step 5
              And user selects Yes in Check your Work section
              And user clicks on Restart
             Then user can see Start, Close and restart button
              And user can see link to "Add health checks to your sample application" quick start
              And user can see 5 Steps visible with checkmark in Green color


        @odc-5010 @to-do
        Scenario: Restart action on Quick Start card: QS-03-TC09
            Given user is at Quick Start card page
             When user clicks "Get started with a sample application" Quick Start
              And user Start button
              And user completes the tour
              And user clicks on Restart
             Then user can see Start button
              And user can see 5 Steps visible for the tour


        @odc-5010 @manual
        Scenario: Resizing Quick Start drawer: QS-03-TC10
            Given user is at Quick Start card page
             When user clicks "Get started with a sample application" Quick Start
              And user drags the Quick Start drawer left and right from the left side of the panel
             Then user is able to resize the Quick Start drawer


        @odc-5010 @manual
        Scenario: Disabling Quick Start: QS-03-TC11
            Given user is at Quick Start card page
              And Exploring Serverless applications quick start is present
              And user is at developer console in inspect element
             When user enters 'window.SERVER_FLAGS.quickStarts = {"disabled":["serverless-application"]}' in console
              And user clicks Enter button in keyboard
             Then user is not able to see the Exploring Serverless applications quick start