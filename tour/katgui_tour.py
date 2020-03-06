import os

from seleniumbase import BaseCase

from .page_objects import Page, SubArray
from .utils import TexttoSpeech

KATGUI_USER = os.getenv("KATGUI_USER")
KATGUI_PASS = os.getenv("KATGUI_PASS")
KATGUI_URL = os.getenv("KATGUI_URL")

THEME = "dark"


class KATGUITourClass(BaseCase):

    speak = TexttoSpeech()

    def setUp(self, **kwargs):
        super(KATGUITourClass, self).setUp()

    @classmethod
    def tearDownClass(cls):
        cls.speak.cleanup()

    def enter_stage(self, func, *args, **kwargs) -> None:
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
            "Welcome to the Karoo Array Telescope Graphical User Interface demonstration, "
            "I will walk you through it!",
            play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step, "Welcome to KATGUI!", title="MeerKAT KatGUI"
        )

        self.speak.text_to_speech(
            "Please enter your SKA email address to login.", play_speech=True,
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
        self.speak.text_to_speech("Please enter your password!", play_speech=True)
        self.enter_stage(
            self.add_tour_step, "Type in your password here.", Page.user_pass
        )

        self.highlight_update_text(Page.user_pass, KATGUI_PASS)

        self.speak.text_to_speech(
            "In order to have full control of the interface, "
            "you will need to login as an Expert User!",
            play_speech=True,
        )

        self.enter_stage(
            self.add_tour_step, "Login as 'Expert User'.", Page.select_user
        )
        self.click(Page.select_user)
        self.click(Page.expert)
        self.speak.text_to_speech(
            "Click login button or hit Enter on your keyboard to login!",
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
            play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step,
            "You might need to disable the alarms and notification.",
            title="Disable Alarms",
        )
        self.speak.text_to_speech(
            "Click on the user icon on the top-right.", play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step,
            "Click on the user icon on the top-right.",
            Page.user_icon,
        )
        self.click(Page.user_icon)

        msg = "Click on the checkbox to disable 'Alarm Notifications'."
        self.speak.text_to_speech(msg, play_speech=True)
        self.enter_stage(
            self.add_tour_step, msg, Page.alarm_notification,
        )
        self.click(Page.alarm_notification)

        msg = "Click on the checkbox to disable 'Alarm Sounds'."
        self.speak.text_to_speech(msg, play_speech=True)
        self.enter_stage(
            self.add_tour_step, msg, Page.alarm_sounds,
        )
        self.click(Page.alarm_sounds)

        msg = "Click anywhere on the page to exit the configuration menu."
        self.speak.text_to_speech(msg, play_speech=True)
        self.enter_stage(
            self.add_tour_step, msg, Page.back_drop,
        )
        self.refresh_page()

    def create_subarray(self) -> None:
        self.speak.text_to_speech(
            "For the purpose of this tour, we will create a simple subarray containing 4 antennas, CBF and SDP.",
            play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step,
            "Let us create a simple subarray containing 4 antennas, CBF and SDP.",
            title="Create a subarray.",
        )

        msg = "From the home page, select Subarray 1"
        self.speak.text_to_speech(
            msg, play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step, msg, SubArray.subarray_1,
        )
        self.click(SubArray.subarray_1)

        msg = "Let's free the sub-array, just in case there was still something running in the background"
        self.speak.text_to_speech(
            msg, play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step, msg, SubArray.free,
        )
        self.click(SubArray.free)

        msg = (
            "Select the user product, for this demo we will select a"
            " beamformer-correlator with a frequency of 856 MHz and 4k channels"
        )
        self.speak.text_to_speech(
            msg, play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step, msg, SubArray.select_product,
        )
        self.click(SubArray.select_product)
        self.sleep(1)
        self.click(SubArray.product)
        self.sleep(0.5)
        msg = "Let's assign CBF resource into our subarray"
        self.speak.text_to_speech(
            msg, play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step, msg, SubArray.cbf_select,
        )
        self.click(SubArray.cbf)

        msg = "Let's assign SDP resource into our subarray"
        self.speak.text_to_speech(
            msg, play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step, msg, SubArray.sdp_select,
        )
        self.click(SubArray.sdp)

        msg = f"Now let's assign {SubArray.no_antennas} antennas into our subarray."
        self.speak.text_to_speech(
            msg, play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step, msg, SubArray.antennas_select,
        )
        for _ in range(SubArray.no_antennas):
            self.click(SubArray.antennas)

        msg = (
            "Now we can initialize our subarray with 4 antennas, CBF and SDP."
            " Note this should take at least 30-60 seconds."
            "In the mean time grab some coffee!"
        )
        self.speak.text_to_speech(
            msg, play_speech=True,
        )
        self.enter_stage(
            self.add_tour_step, msg, SubArray.initialize_select,
        )
        self.click(SubArray.initialize)
        self.sleep(25)
        msg = (
            "Congratulations! You now have a running sub array which simply means that "
            "you have control over the Karoo Radio Telescope."
        )
        self.speak.text_to_speech(
            msg, play_speech=True,
        )

    def create_schedule_block(self):
        pass

    def test_katgui_tour(self) -> None:
        """KATGUI Tour/Demonstration"""
        self.login_katgui()
        self.disable_alarms()
        self.create_subarray()
        self.create_schedule_block()
