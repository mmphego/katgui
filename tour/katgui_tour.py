import os

from seleniumbase import BaseCase

KATGUI_USER = os.getenv("KATGUI_USER")
KATGUI_PASS = os.getenv("KATGUI_PASS")

THEME = "dark"
KATGUI_URL = "http://monctl.devx.camlab.kat.ac.za/katgui/login"


class MyTourClass(BaseCase):
    def enter_stage(self, func, *args, **kwargs):
        self.create_tour(theme=THEME)
        func(*args, **kwargs)
        self.play_tour()

    def login_katgui(self):
        self.open(KATGUI_URL)
        self.wait_for_element("#input_1")

        self.enter_stage(
            self.add_tour_step, "Welcome to KATGUI!", title="MeerKAT KatGUI"
        )

        self.enter_stage(
            self.add_tour_step, "Type in your email account here.", "#input_1"
        )
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
        self.highlight_update_text("#input_2", KATGUI_PASS)

        self.enter_stage(
            self.add_tour_step, "Login as 'Expert User'.", "#select_value_label_0"
        )
        self.click("#select_value_label_0")
        self.click("#select_option_6")

        selector = "#ui-view-container-div > div > form > button"
        self.enter_stage(self.add_tour_step, "Then click to 'Login'.", selector)
        self.enter_stage(self.add_tour_step, "Or press [ENTER] after entry.", selector)
        self.click(selector)

    def test_google_tour(self):
        self.login_katgui()
