from seleniumbase import BaseCase

class MyTourClass(BaseCase):

    def run_tour(self, func, *args):
        self.create_tour(theme="dark")
        func(*args)
        self.play_tour()

    def login_katgui(self):
        self.open('http://monctl.devx.camlab.kat.ac.za/katgui/login')
        self.wait_for_element("#input_1")

        self.create_tour(theme="dark")
        self.add_tour_step("Welcome to KATGUI!", title="MeerKAT KatGUI")
        self.add_tour_step("Type in your email account here.", '#input_1')
        self.play_tour()
        self.highlight_update_text('#input_1', "cam@ska.ac.za")

        self.run_tour(
            self.add_tour_step, "Type in your password here.", '#input_2'
        )

        self.highlight_update_text('#input_2', "cam")

        self.create_tour(theme="dark")
        self.add_tour_step("Login as 'Expert User'.", "#select_value_label_0")
        self.play_tour()
        self.click("#select_value_label_0")
        self.click("#select_option_6")

        self.create_tour(theme="dark")
        selector = "#ui-view-container-div > div > form > button"
        self.add_tour_step("Then click to 'Login'.", selector)
        self.add_tour_step("Or press [ENTER] after entry.", selector)
        self.play_tour()
        self.click(selector)

    def test_google_tour(self):
        self.login_katgui()
