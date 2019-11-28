# Welcome to the KATGUI tour/demo


## Installation

Create a virtual environment, source it and run:
```bash
pip install -r requirements.txt
```

## Usage

In order to run the tour, execute:

```bash
export KATGUI_USER=<your-ska-email-address>
export KATGUI_PASS=<your-password>
# You can also disable/enable speech feedback
export ENABLE_SPEECH=True
# You can execute the tour either using nosetests or pytest with headed
pytest -sv katgui_tour.py --headed
```

## Demo

![Peek 2019-11-28 16-36](https://user-images.githubusercontent.com/7910856/69814760-90164c80-11fd-11ea-9005-2d89eda8279c.gif)
