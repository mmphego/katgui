import os

from ast import literal_eval

from seleniumbase import BaseCase

from .page_objects import Page, SubArray, Obs
from .utils import TexttoSpeech

KATGUI_USER = os.getenv("KATGUI_USER")
KATGUI_PASS = os.getenv("KATGUI_PASS")
KATGUI_URL = os.getenv("KATGUI_URL")
ENABLE_SPEECH = literal_eval(os.getenv("ENABLE_SPEECH", "False"))

THEME = "dark"


class KATGUITourClass(BaseCase):

    speak = TexttoSpeech(speech_enabled=ENABLE_SPEECH)

    def setUp(self, **kwargs):
        super(KATGUITourClass, self).setUp()

    @classmethod
    def tearDownClass(cls):
        cls.speak.cleanup()

    def enter_stage(self, func, *args, **kwargs):
        """Wrapper function for creating, playing the tour and text-to-speech."""
        self.create_tour(theme=THEME)
        if kwargs.get("speech"):
            self.speak.text_to_speech(kwargs.get("speech"))
            del kwargs["speech"]
        func(*args, **kwargs)
        self.play_tour()

    def login_katgui(self):
        """Detailed login instructions for KATGUI end-user."""
        self.assertIsNotNone(
            KATGUI_URL, "Ensure that KATGUI_URL as defined an environmental variables.",
        )
        self.maximize_window()
        self.open(KATGUI_URL)
        self.wait_for_element(Page.enter_input)

        self.enter_stage(
            self.add_tour_step,
            "Welcome to KATGUI!",
            title="MeerKAT KatGUI",
            speech=(
                "Welcome to the Karoo Array Telescope Graphical User Interface demonstration, "
                "I will walk you through it!"
            ),
        )

        self.enter_stage(
            self.add_tour_step,
            "Type in your email account here.",
            Page.enter_input,
            speech="Please enter your SKA email address to login.",
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
        self.enter_stage(
            self.add_tour_step,
            "Type in your password here.",
            Page.user_pass,
            speech="Please enter your password!",
        )

        self.highlight_update_text(Page.user_pass, KATGUI_PASS)

        self.enter_stage(
            self.add_tour_step,
            "Login as 'Expert User'.",
            Page.select_user,
            speech=(
                "In order to have full control of the interface, "
                "you will need to login as an Expert User!",
            ),
        )
        self.click(Page.select_user)
        self.click(Page.expert)

        self.enter_stage(
            self.add_tour_step,
            "Then click to 'Login'.",
            Page.submit_button,
            speech="Click login button or hit Enter on your keyboard to login!",
        )
        self.enter_stage(
            self.add_tour_step, "Or press [ENTER] after entry.", Page.submit_button
        )
        self.click(Page.submit_button)

    def disable_alarms(self):
        self.enter_stage(
            self.add_tour_step,
            "You might need to disable the alarms and notification.",
            title="Disable Alarms",
            speech="The alarm was not pleasant, was it! Let's disable the alarm for the duration of this tour.",
        )
        msg = "Click on the user icon on the top-right."
        self.enter_stage(self.add_tour_step, msg, Page.user_icon, speech=msg)
        self.click(Page.user_icon)

        msg = "Click on the checkbox to disable 'Alarm Notifications'."
        self.enter_stage(self.add_tour_step, msg, Page.alarm_notification, speech=msg)
        self.click(Page.alarm_notification)

        msg = "Click on the checkbox to disable 'Alarm Sounds'."
        self.enter_stage(self.add_tour_step, msg, Page.alarm_sounds, speech=msg)
        self.click(Page.alarm_sounds)

        msg = "Click anywhere on the page to exit the configuration menu."
        self.enter_stage(self.add_tour_step, msg, Page.back_drop, speech=msg)
        self.refresh_page()

    def create_subarray(self):
        self.enter_stage(
            self.add_tour_step,
            "Let us create a simple subarray containing 4 antennas, CBF and SDP.",
            title="Create a subarray.",
            speech="For the purpose of this tour, we will create a simple subarray containing 4 antennas, CBF and SDP.",
        )

        msg = "From the home page, select Subarray 1"
        self.enter_stage(self.add_tour_step, msg, SubArray.subarray_1, speech=msg)
        self.click(SubArray.subarray_1)

        msg = "Let's free the sub-array, just in case there was still something running in the background"
        self.enter_stage(self.add_tour_step, msg, SubArray.free, speech=msg)
        self.click(SubArray.free)

        msg = (
            "Select the user product, for this demo we will select a"
            " beamformer-correlator with a frequency of 856 MHz and 4k channels"
        )
        self.enter_stage(self.add_tour_step, msg, SubArray.select_product, speech=msg)
        self.click(SubArray.select_product)
        self.sleep(1)
        self.click(SubArray.product)
        self.sleep(0.5)

        msg = "Let's assign CBF resource into our subarray"
        self.enter_stage(self.add_tour_step, msg, SubArray.cbf_select, speech=msg)
        self.click(SubArray.cbf)

        msg = "Ensure, that CBF has enough resources available before you initialize."
        self.enter_stage(self.add_tour_step, msg, SubArray.cbf_resources, speech=msg)
        msg = "Let's assign SDP resource into our subarray"
        self.enter_stage(self.add_tour_step, msg, SubArray.sdp_select, speech=msg)
        self.click(SubArray.sdp)

        msg = f"Now let's assign {SubArray.no_antennas} antennas into our subarray."
        self.enter_stage(self.add_tour_step, msg, SubArray.antennas_select, speech=msg)
        for _ in range(SubArray.no_antennas):
            self.click(SubArray.antennas)

        msg = (
            "Now we can initialize our subarray with 4 antennas, CBF and SDP."
            " Note this should take at least 30-60 seconds."
            "In the mean time grab some coffee!"
        )
        self.enter_stage(
            self.add_tour_step, msg, SubArray.initialize_select, speech=msg
        )
        self.click(SubArray.initialize)
        self.sleep(20)

        self.speak.text_to_speech(
            "Congratulations! You now have a running sub array which simply means that "
            "you have control over the Karoo Radio Telescope."
        )

    def create_schedule_block(self):
        msg = (
            "Let's run a pre-approved schedule block. Click on Managed Schedule Blocks."
        )
        self.enter_stage(self.add_tour_step, msg, Obs.manage_obs_sel, speech=msg)
        self.click(Obs.manage_obs_sel)

        msg = "From the approved schedule blocks, let's select the first one from the list and verify it."
        self.enter_stage(self.add_tour_step, msg, Obs.approved_obs, speech=msg)

        msg = "Let's assign schedule block to our subarray"
        self.enter_stage(self.add_tour_step, msg, Obs.approved_sb, speech=msg)
        self.click(Obs.approved_sb)

        msg = "Schedule and verify the block, before we run it."

        self.enter_stage(self.add_tour_step, msg, Obs.sb_schedule, speech=msg)
        self.click(Obs.sb_schedule)
        self.sleep(1)

        msg = "Select the ellipsis icon to access more options."
        self.enter_stage(self.add_tour_step, msg, Obs.ellipsis_select, speech=msg)
        self.click(Obs.ellipsis_select)

        msg = "From the menu, select 'View Dryrun' output. This will open a new window."
        self.enter_stage(self.add_tour_step, msg, Obs.dry_run, speech=msg)
        self.speak.text_to_speech(
            "Browse through the logs and check for any anomalies."
        )
        self.click(Obs.dry_run)
        open_windows = self.driver.window_handles
        if len(open_windows) > 1:
            self.sleep(2)
            self.switch_to_window(open_windows[0])

        msg = (
            "If you are happy with the dry-run output, we can execute the observation."
        )
        self.enter_stage(self.add_tour_step, msg, Obs.execute, speech=msg)
        self.click(Obs.execute)

        msg = (
            "Well done, you have successfully built a subarray and ran an observation. "
            "The Observation will take a while to execute, while it runs let's check the sensors. "
        )
        self.enter_stage(
            self.add_tour_step,
            "Subarray and Observation created successfully!",
            title="Well Done!",
            speech=msg,
        )

    def test_katgui_tour(self):
        """KATGUI Tour/Demonstration"""
        self.login_katgui()
        self.disable_alarms()
        self.create_subarray()
        self.create_schedule_block()
