import os

from seleniumbase import BaseCase

from .utils import TexttoSpeech

KATGUI_USER = os.getenv("KATGUI_USER")
KATGUI_PASS = os.getenv("KATGUI_PASS")

THEME = "dark"
KATGUI_URL = "http://monctl.devx.camlab.kat.ac.za/katgui/login"


class MyTourClass(BaseCase):

    speak = TexttoSpeech

    def enter_stage(self, func, *args: str, **kwargs: str) -> None:
        """Wrapper function for creating and playing the tour"""
        self.create_tour(theme=THEME)
        func(*args, **kwargs)
        self.play_tour()

    def login_katgui(self) -> None:
        """Detailed login in instructions for KATGUI end-user."""
        self.open(KATGUI_URL)
        self.wait_for_element("#input_1")
        self.speak(
            "Welcome to the Karoo Array Telescope Graphical User Interface, "
            "I will walk you through it!",
            "walkthrough",
        ).play_speech()
        self.enter_stage(
            self.add_tour_step, "Welcome to KATGUI!", title="MeerKAT KatGUI"
        )

        self.enter_stage(
            self.add_tour_step, "Type in your email account here.", "#input_1"
        )
        self.speak(
            "Please enter your S K A email address to login.", "enter_email"
        ).play_speech()

        self.assertIsNotNone(
            KATGUI_USER,
            "Ensure that KATGUI_USER as defined an environmental variables.",
        )
        self.highlight_update_text("#input_1", KATGUI_USER)

        self.assertIsNotNone(
            KATGUI_PASS,
            "Ensure that KATGUI_PASS as defined an environmental variables.",
        )
        self.enter_stage(self.add_tour_step, "Type in your password here.", "#input_2")
        self.speak("Please enter your password!", "enter_pass").play_speech()

        self.highlight_update_text("#input_2", KATGUI_PASS)

        self.speak(
            "In order to have full control of the interface, "
            "you will need to login as an Expert User!",
            "expert_user",
        ).play_speech()

        self.enter_stage(
            self.add_tour_step, "Login as 'Expert User'.", "#select_value_label_0"
        )
        self.click("#select_value_label_0")
        self.click("#select_option_6")
        self.speak(
            "Click login button or hit Enter on your keyboard to login!", "login",
        ).play_speech()

        selector = "#ui-view-container-div > div > form > button"
        self.enter_stage(self.add_tour_step, "Then click to 'Login'.", selector)
        self.enter_stage(self.add_tour_step, "Or press [ENTER] after entry.", selector)
        self.click(selector)

    def disable_alarms(self):
        self.enter_stage(
            self.add_tour_step,
            "You might need to disable the alarms and notification.",
            title="Disable Alarms",
        )

        user_icon = "#main-top-toolbar > div > button:nth-child(7) > span"
        self.enter_stage(
            self.add_tour_step, "Click on the user icon on the top-right.", user_icon
        )
        self.click(user_icon)

        alarm_not = (
            "body > md-content > md-sidenav.md-sidenav-right._md.md-deep-"
            "purple-theme.layout-column > md-content > md-list > md-item:nth-child(5) > "
            "md-item-content:nth-child(2) > md-checkbox > div.md-label"
        )
        self.enter_stage(
            self.add_tour_step,
            "Click on the checkbox to disable 'Alarm Notifications'.",
            alarm_not,
        )
        self.click(alarm_not)

        alarm_sound = (
            "body > md-content > md-sidenav.md-sidenav-right._md.md-deep-purple-theme."
            "layout-column > md-content > md-list > md-item:nth-child(5) > "
            "md-item-content:nth-child(4) > md-checkbox > div.md-container.md-ink-ripple"
        )
        self.enter_stage(
            self.add_tour_step,
            "Click on the checkbox to disable 'Alarm Sounds'.",
            alarm_sound,
        )
        self.click(alarm_sound)

        home = '//*[@id="main-top-toolbar"]/div/span'
        self.enter_stage(
            self.add_tour_step,
            "Click anywhere on the page to exit the configuration menu.",
            home,
        )
        self.refresh_page()

    def create_subarray(self):
        self.enter_stage(
            self.add_tour_step,
            "Let us create a simple subarray containing 4 antennas, CBF and SDP.",
            title="Create a subarray",
        )
        subarray = '//*[@id="ui-view-container-div"]/div/div[1]/div/div[1]/div/button[1]'
        self.click(subarray)

    def test_katgui_tour(self) -> None:
        """KATGUI Tour/Demonstration"""
        self.login_katgui()
        self.disable_alarms()
        self.create_subarray()
