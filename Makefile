.ONESHELL:

SHELL := /bin/bash
DATE_ID := $(shell date +"%y.%m.%d")
# Get package name from pwd
PACKAGE_NAME := $(shell basename $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST)))))

.DEFAULT_GOAL := help

define BROWSER_PYSCRIPT
import os, webbrowser, sys

try:
	from urllib import pathname2url
except:
	from urllib.request import pathname2url

webbrowser.open("file://" + pathname2url(os.path.abspath(sys.argv[1])))
endef

define PRINT_HELP_PYSCRIPT
import re, sys
print("Please use `make <target>` where <target> is one of\n")
for line in sys.stdin:
	match = re.match(r'^([a-zA-Z_-]+):.*?## (.*)$$', line)
	if match:
		target, help = match.groups()
		if not target.startswith('--'):
			print(f"{target:20} - {help}")
endef

export BROWSER_PYSCRIPT
export PRINT_HELP_PYSCRIPT
# See: https://docs.python.org/3/using/cmdline.html#envvar-PYTHONWARNINGS
export PYTHONWARNINGS=ignore

PYTHON := python3
BROWSER := $(PYTHON) -c "$$BROWSER_PYSCRIPT"

.SILENT: help
help:
	$(PYTHON) -c "$$PRINT_HELP_PYSCRIPT" < $(MAKEFILE_LIST)

# -------------------------------- Builds and Installations -----------------------------

.PHONY: bootstrap
bootstrap: install build-image run  ## Installs docker, and runs KATGUI webserver

build-new-image:  ## Pull the latest image and build docker image from local Dockerfile.
	docker-compose build --pull

build-image:  ## Build docker image from local Dockerfile.
	docker-compose build

dist:  ## Build dist files.
	docker-compose run $(PACKAGE_NAME) gulp build
	ls -l dist

--check-os:
	if [ "$$(uname)" == "Darwin" ]; then \
		echo "Please follow instructions on how to install docker on mac"; \
		echo "Click: https://docs.docker.com/docker-for-mac/install/"; \
		exit 1; \
	elif [ "$$(expr substr $$(uname -s) 1 5)" == "Linux" ]; then \
		echo "Ensure you have sudo privileges, before you continue."; \
	fi; \

_install-docker:
	echo "Installing Docker..."
	curl -fsSL https://get.docker.com -o get-docker.sh
	bash -c "sudo bash get-docker.sh"
	rm -rf get-docker.sh

_install-docker-compose:
	echo "Installing docker-compose..."
	$(PYTHON) -m pip install -U docker-compose

.SILENT: --check-os install
install: --check-os  ## Check if docker and docker-compose exists, if not install them on host
	if [ ! -x "$$(command -v docker)" ]; then \
		$(MAKE) _install-docker
	else \
		echo "Docker is already installed."; \
	fi; \
	if [ ! -x "$$(command -v docker-compose)" ]; then \
		$(MAKE) _install-docker-compose
	else \
		echo "docker-compose is already installed."; \
	fi; \

# -------------------------------------- Project Execution -------------------------------
run:  ## Run KATGUI webserver
	docker-compose up

stop:  ## Stop KATGUI webserver
	docker-compose stop

jenkins-build:
	echo "## Updating mkatgui code from git ...";
	git remote update -p;
	git merge --ff-only origin/master;
	echo "## Installing npm packages ...";
	yarn install;
	echo "## Performing gulp build ...";
	gulp build;

push-dist:
	echo "Pushing dist files upsteam."
	$(nop)
# -------------------------------------- Clean Up  --------------------------------------
.PHONY: clean
clean: clean-build clean-node-modules clean-docker  ## Remove all build, node_modules and docker containers.

clean-build:  ## Remove build artefacts.
	rm -fr dist/

clean-node-modules:  ## Remove node_modules artefacts.
	rm -rf node_modules

clean-docker:  ## Remove docker container.
	docker-compose rm -sf

# -------------------------------------- Code Style  -------------------------------------

lint:  ## Check style with `eslint`
	# TBD: https://eslint.org/docs/user-guide/getting-started
	$(nop)

formatter:  ## Format style with ...
	# TBD: https://www.npmjs.com/package/js-beautify
	$(nop)

# ---------------------------------------- Tests -----------------------------------------
test:  ## Run tests
	# TBD: https://gulpjs.com/docs/en/getting-started/creating-tasks
	$(nop)
