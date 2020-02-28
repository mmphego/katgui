# -*- coding: utf-8 -*-
import os
import time

from seleniumbase import BaseCase

from .page_objects import SubArray

KATGUI_USER = os.getenv("KATGUI_USER")
KATGUI_PASS = os.getenv("KATGUI_PASS")
KATGUI_URL = os.getenv('KATGUI_URL')

class KATGUITestCase(BaseCase):

    def setUp(self):
        super(KATGUITestCase, self).setUp()
        self.open(KATGUI_URL)

    def tearDown(self):
        self.click(SubArray.free)

    def test_start_subarray(self):
        self.update_text(SubArray.username, KATGUI_USER)
        self.update_text(SubArray.password, KATGUI_PASS)
        self.click(SubArray.select_user)
        self.click(SubArray.expert_user)
        self.click(SubArray.submit)

        self.click(SubArray.menu_bar)
        self.click(SubArray.notification_checkbox)
        self.click(SubArray.alarm_checkbox)
        self.click(SubArray.back)

        self.click(SubArray.subarray)

        self.click(SubArray.free)
        self.click(SubArray.select_mode)
        self.click(SubArray.button)

        self.click(SubArray.cbf)
        for _ in range(4):
            self.click(SubArray.antennas)
        self.click(SubArray.sdp)

        self.click(SubArray.initialize)
        time.sleep(30)
