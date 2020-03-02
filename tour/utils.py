from random import choice
import pathlib
import subprocess
import requests

from ast import literal_eval
from contextlib import suppress


class TexttoSpeech:

    ENABLE_SPEECH = literal_eval(pathlib.os.getenv("ENABLE_SPEECH", "False"))
    API_URL = "http://responsivevoice.org/responsivevoice/getvoice.php"

    def __init__(
        self,
        gender: str = "",
        lang: str = "en-ZA",
        pitch: float = 0.5,
        rate: float = 0.5,
        service: str = "",
        voice_name: str = "",
        vol: int = 1,
        token: list = ["FQ9r4hgY", "HY7lTyiS"],
    ) -> None:
        self.file_path = None
        self.gender = gender
        self.lang = lang
        self.pitch = pitch
        self.rate = rate
        self.service = service
        self.voice_name = voice_name
        self.vol = vol
        self.token = choice(token)

    @staticmethod
    def which(program: str) -> str:
        """Takes a program name or full path,
        and returns the full path of the requested executable.
        """
        with suppress(Exception):
            return subprocess.check_output(["which", program]).strip().decode()

    def text_to_speech(
        self,
        text: str,
        filename: str,
        assets_dir: str = "assets",
        ext: str = "mp3",
        play_speech: bool = False,
        re_download: bool = False,
    ) -> None:
        """Generate Speech from text."""
        params = {
            "gender": self.gender,
            "key": self.token,
            "pitch": self.pitch,
            "rate": self.rate,
            "sv": self.service,
            "t": text,
            "tl": self.lang,
            "vn": self.voice_name,
            "vol": self.vol,
        }

        if not pathlib.Path(assets_dir).is_dir():
            pathlib.Path(assets_dir).mkdir()

        self.file_path = pathlib.Path(f"{assets_dir}/{filename}.{ext}").absolute()
        if not self.file_path.exists() or re_download:
            req = requests.get(self.API_URL, params)
            assert req.status_code == 200
            with open(self.file_path, "wb") as f:
                f.write(req.content)

        if play_speech:
            self.play_speech()

    def play_speech(self, play_with: str = "cvlc") -> None:
        """Play generated TTS as mp3 files."""
        if self.ENABLE_SPEECH:
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
                raise RuntimeError(
                    f"Failed to play {self.file_path} through {player_cmd}."
                )

    def cleanup(self):
        if self.file_path.parent.is_dir():
            pathlib.os.system(f"rm -rf {self.file_path.parent.as_posix()}")
