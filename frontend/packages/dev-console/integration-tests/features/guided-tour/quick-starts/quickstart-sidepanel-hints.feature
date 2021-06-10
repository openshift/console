@guided-tour
Feature: Enable hints interaction in Quick Starts sidepanel
              As a user, I should be able to click on a hint link in the Quick Starts content and see the hint being highlighted in the UI.


        Background:
            Given user is at developer perspective
              And sample-application CR Quick Start is available
              And explore-serverless CR Quick Start is available
              And explore-pipeline CR Quick Start is available
              And add-healthchecks CR Quick Start is available


        @regression @manual
        Scenario: Quick Starts hints: QS-05-TC01
            Given user is at Quick Starts catalog page
             When user clicks on sample-application Quick Starts card
              And user clicks on Start button
              And user clicks on the perspective switcher link in step 1
             Then user can see perspective switcher with Developer as value has been highlighted


        @regression @manual
        Scenario: Quick Starts hint is out of frame: QS-05-TC02
            Given user is at Quick Starts catalog page
             When user clicks on Setting up Serverless Quick Starts card
              And user clicks on Start button
              And user switches to Administrator perspective
              And user expands workloads tab in navigation menu
              And And user scrolls down till the perspective switcher is no longer visible in the viewport
              And user click on Administrator link in step 1
             Then user can see window scrolls up to highlight perspective switcher with value Administrator


        @regression @manual
        Scenario: Hint when vertical navigation is collapsed: QS-05-TC03
            Given user is at Quick Starts catalog page
             When user clicks on sample-application Quick Starts card
              And user clicks on Start button
              And user clicks on toggle button to disable vertical navigation menu
              And user clicks on the perspective switcher link in step 1
             Then user can not see anything happenning

        @regression @manual
        Scenario: user is in the wrong perspective: QS-05-TC04
            Given user is at Administrator perspective
              And user is on step one of sample-application Quick Starts
             When user clicks on Add in the step 1
             Then user can not see anything happenning


        @regression @manual
        Scenario: Highlight disappears when clicked anywhere in the UI: QS-05-TC05
            Given user is at Quick Starts catalog page
             When user clicks on sample-application Quick Starts card
              And user clicks on Start button
              And user clicks on the perspective switcher link in step 1
              And user clicks on Topology
             Then user can see highlight disappeared from perspective switcher


        @regression @manual
        Scenario: Highlight changes when clicked on other hint link: QS-05-TC06
            Given user is at Quick Starts catalog page
             When user clicks on sample-application Quick Starts card
              And user clicks on Start button
              And user clicks on the perspective switcher link in step 1
              And user clicks on Add link
             Then user can see highlight from perspective switcher disappeared
              And highlight on Add appears
