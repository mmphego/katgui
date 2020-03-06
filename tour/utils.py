import functools
import pathlib
import subprocess

from contextlib import suppress
from random import choice

import requests


def count_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)

    wrapper.calls = 0
    return wrapper


class TexttoSpeech:
    API_URL = "http://responsivevoice.org/responsivevoice/getvoice.php"

    def __init__(
        self,
        gender: str = "",
        lang: str = "en-ZA",
        rate: float = 0.5,
        token: list = ["FQ9r4hgY", "HY7lTyiS"],
        speech_enabled=False,
    ) -> None:
        self.file_path = None
        self.gender = pathlib.os.getenv("VOICE_GENDER", gender)
        self.lang = lang
        self.rate = pathlib.os.getenv("VOICE_SPEED", rate)
        self.token = choice(token)
        self.speech_enabled = speech_enabled

    @staticmethod
    def which(program: str) -> str:
        """Takes a program name or full path,
        and returns the full path of the requested executable.
        """
        with suppress(Exception):
            return subprocess.check_output(["which", program]).strip().decode()

    @count_calls
    def text_to_speech(
        self,
        text: str,
        filename: str = "",
        assets_dir: str = "assets",
        ext: str = "mp3",
        play_speech: bool = False,
        re_download: bool = False,
    ) -> None:
        """Generate Speech from text."""
        params = {
            "gender": self.gender,
            "key": self.token,
            "rate": self.rate,
            "t": text,
            "tl": self.lang,
        }
        if not pathlib.Path(assets_dir).is_dir():
            pathlib.Path(assets_dir).mkdir()
        if not filename:
            filename = f"filename_{str(self.text_to_speech.calls).zfill(2)}"
        self.file_path = pathlib.Path(f"{assets_dir}/{filename}.{ext}").absolute()
        if not self.file_path.exists() or re_download:
            req = requests.get(self.API_URL, params)
            assert req.status_code == 200
            with open(self.file_path, "wb") as f:
                f.write(req.content)
        if self.file_path.exists() and self.speech_enabled:
            self.play_speech()

    def play_speech(self, play_with: str = "cvlc") -> None:
        """Play generated TTS as mp3 files."""
        FNULL = open(subprocess.os.devnull, "wb")
        play_with = (
            self.which(play_with)
            if self.which(play_with) is not None
            else self.which("mpg123")
        )
        err_msg = (
            "No Player installed, ensure that either 'mpg123' or 'vlc' is installed "
            "in your system.\n"
            "Run: 'sudo apt install --install-recommends mpg123 vlc vlc-bin'"
        )
        assert play_with, err_msg

        if "cvlc" in play_with:
            player_cmd = f"{play_with} --play-and-exit --no-loop"
        elif "mpg123" in play_with:
            player_cmd = f"{play_with}"

        ret_code = subprocess.call(
            f"{player_cmd} {self.file_path} >/dev/null 2>&1 &",
            shell=True,
            stdout=FNULL,
            stderr=subprocess.STDOUT,
        )

        if ret_code != 0:
            raise RuntimeError(f"Failed to play {self.file_path} through {player_cmd}.")

    def cleanup(self):
        if hasattr(self.file_path, "parent") and self.file_path.parent.is_dir():
            pathlib.os.system(f"rm -rf {self.file_path.parent.as_posix()}")
