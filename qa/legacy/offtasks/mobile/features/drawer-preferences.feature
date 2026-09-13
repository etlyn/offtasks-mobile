@e2e @mobile @drawer @preferences
# Feature code: 8
Feature: Mobile drawer preferences and navigation
    The drawer should work as both the main navigation hub and the place for persistent task preferences.

    Background:
        Given the tester is signed in to the mobile app
        And the navigation drawer can be opened from the overview top bar

    # Scenario code: 8.1
    Scenario: Review drawer profile summary and main destinations
        When the tester opens the navigation drawer
        Then the drawer should show the signed-in user summary and completion count
        And the drawer should expose the Statistics destination and home reset action

    # Scenario code: 8.2
    Scenario: Toggle appearance and task preferences from the drawer
        Given the navigation drawer is open
        When the tester toggles appearance, Hide Completed Tasks, Advanced Mode, or Auto-move due tasks
        Then the drawer control should reflect the new state immediately
        And the related overview behavior should update after the drawer is closed

    # Scenario code: 8.3
    Scenario: Reset navigation back to the Today overview
        Given the tester has navigated away from the Today overview tab
        When the tester uses the drawer hero card or navigation to return home
        Then the app should land on the Overview section
        And the Today tab should be the active destination

    # Scenario code: 8.4
    Scenario: Review app version and sign out from the drawer
        Given the navigation drawer is open
        When the tester reviews the account controls
        Then the drawer should show the app version
        When the tester logs out from the drawer
        Then the app should return to the authentication screen