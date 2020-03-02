import os

from seleniumbase import BaseCase

from .page_objects import Page
from .utils import TexttoSpeech

KATGUI_USER = os.getenv("KATGUI_USER")
KATGUI_PASS = os.getenv("KATGUI_PASS")
KATGUI_URL = os.getenv("KATGUI_URL")

THEME = "dark"


class MyTourClass(BaseCase):

    speak = TexttoSpeech()

    def setUp(self):
        super(MyTourClass, self).setUp()

    def tearDown(self):
        self.speak.cleanup()

    def enter_stage(self, func, *args: str, **kwargs: str) -> None:
        """Wrapper function for creating and playing the tour"""
        self.create_tour(theme=THEME)
        func(*args, **kwargs)
        self.play_tour()

    def login_katgui(self) -> None:
        """Detailed login in instructions for KATGUI end-user."""
        self.assertIsNotNone(
            KATGUI_URL, "Ensure that KATGUI_URL as defined an environmental variables.",
        )
        self.open(KATGUI_URL)
        self.wait_for_element(Page.enter_input)
        self.speak.text_to_speech(
            "Welcome to the Karoo Array Telescope Graphical User Interface, "
            "I will walk you through it!",
            "walkthrough",
            play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step, "Welcome to KATGUI!", title="MeerKAT KatGUI"
        )

        self.speak.text_to_speech(
            "Please enter your S K A email address to login.",
            Page.user_email,
            play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step, "Type in your email account here.", Page.enter_input
        )

        self.assertIsNotNone(
            KATGUI_USER,
            "Ensure that KATGUI_USER as defined an environmental variables.",
        )
        self.highlight_update_text(Page.enter_input, KATGUI_USER)

        self.assertIsNotNone(
            KATGUI_PASS,
            "Ensure that KATGUI_PASS as defined an environmental variables.",
        )
        self.speak.text_to_speech(
            "Please enter your password!", "enter_pass", play_speech=True
        )
        self.enter_stage(
            self.add_tour_step, "Type in your password here.", Page.user_pass
        )

        self.highlight_update_text(Page.user_pass, KATGUI_PASS)

        self.speak.text_to_speech(
            "In order to have full control of the interface, "
            "you will need to login as an Expert User!",
            "expert_user",
            play_speech=True,
        )

        self.enter_stage(
            self.add_tour_step, "Login as 'Expert User'.", Page.select_user
        )
        self.click(Page.select_user)
        self.click(Page.expert)
        self.speak.text_to_speech(
            "Click login button or hit Enter on your keyboard to login!",
            "login",
            play_speech=True,
        )

        self.enter_stage(
            self.add_tour_step, "Then click to 'Login'.", Page.submit_button
        )
        self.enter_stage(
            self.add_tour_step, "Or press [ENTER] after entry.", Page.submit_button
        )
        self.click(Page.submit_button)

    def disable_alarms(self) -> None:
        self.speak.text_to_speech(
            "The alarm was not pleasant, was it! Let's disable the alarm for the duration of this tour.",
            "alarm",
            play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step,
            "You might need to disable the alarms and notification.",
            title="Disable Alarms",
        )

        self.enter_stage(
            self.add_tour_step,
            "Click on the user icon on the top-right.",
            Page.user_icon,
        )
        self.click(Page.user_icon)

        self.enter_stage(
            self.add_tour_step,
            "Click on the checkbox to disable 'Alarm Notifications'.",
            Page.alarm_notification,
        )
        self.click(Page.alarm_notification)

        self.enter_stage(
            self.add_tour_step,
            "Click on the checkbox to disable 'Alarm Sounds'.",
            Page.alarm_sounds,
        )
        self.click(Page.alarm_sounds)

        self.enter_stage(
            self.add_tour_step,
            "Click anywhere on the page to exit the configuration menu.",
            Page.back_drop,
        )
        self.refresh_page()

    def create_subarray(self) -> None:
        self.speak.text_to_speech(
            "For the purpose of this tour, we will create a simple subarray containing 4 antennas, C B F and S D P.",
            "subarray",
            play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step,
            "Let us create a simple subarray containing 4 antennas, CBF and SDP.",
            title="Create a subarray.",
        )

        self.click(Page.subarray_1)

    def test_katgui_tour(self) -> None:
        """KATGUI Tour/Demonstration"""
        self.login_katgui()
        self.disable_alarms()
        self.create_subarray()
