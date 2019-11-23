import subprocess
from contextlib import suppress

from pathlib import Path
from gtts import gTTS


class TexttoSpeech:
    def __init__(
        self, text: str, filename: str, assets_dir: str = "assets", ext: str = "mp3"
    ) -> None:
        self.text = text
        if not Path(assets_dir).is_dir():
            Path(assets_dir).mkdir()
        self.filename = Path(f"{assets_dir}/{filename}.{ext}").absolute()

    @staticmethod
    def which(program: str) -> str:
        """Takes a program name or full path,
        and returns the full path of the requested executable.
        """
        with suppress(Exception):
            return subprocess.check_output(["which", program]).strip().decode()

    def text_to_speech(self) -> gTTS:
        """Generate speech from text using Google TTS API."""
        tts = gTTS(self.text)
        return tts

    def save_to_mp3(self) -> None:
        """Save generated TTS as mp3 files."""
        tts = self.text_to_speech()
        tts.save(self.filename)

    def play_speech(self, play_with: str = "cvlc") -> None:
        """Play generated TTS as mp3 files."""
        if not self.filename.is_file():
            self.save_to_mp3()

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
            f"{player_cmd} {self.filename}",
            shell=True,
            stdout=FNULL,
            stderr=subprocess.STDOUT,
        )

        if ret_code != 0:
            raise RuntimeError(f"Failed to play {self.filename} through {player_cmd}.")
