# -*- coding: utf-8 -*-


class Page:
    back_drop = '//*[@id="main-top-toolbar"]/div/span'
    alarm_sounds = (
        "body > md-content > md-sidenav.md-sidenav-right._md.md-deep-purple-theme."
        "layout-column > md-content > md-list > md-item:nth-child(5) > "
        "md-item-content:nth-child(4) > md-checkbox > div.md-container.md-ink-ripple"
    )
    alarm_notification = (
        "body > md-content > md-sidenav.md-sidenav-right._md.md-deep-"
        "purple-theme.layout-column > md-content > md-list > md-item:nth-child(5) > "
        "md-item-content:nth-child(2) > md-checkbox > div.md-container.md-ink-ripple"
    )
    user_icon = "#main-top-toolbar > div > button:nth-child(7) > span"
    enter_input = "#input_1"
    expert = "#select_option_6"
    html = "html"
    select_user = "#select_value_label_0"
    submit_button = "#ui-view-container-div > div > form > button"
    user_email = "enter_email"
    user_pass = "#input_2"


class SubArray:
    no_antennas = 4
    html = "html"
    subarray_1 = '//*[@id="ui-view-container-div"]/div/div[1]/div/div[1]/div/button[1]'
    free = (
        "#ui-view-container-div > div > div.layout-column.flex > div > div > div:nth-child(1) > div > "
        "div.md-whiteframe-z2.layout-column.flex > md-toolbar > "
        "span.fa.fa-recycle.subarray-action-icon.hover-opacity.md-ink-ripple "
    )
    select_product = (
        "#ui-view-container-div > div > div.layout-column.flex > div > div > div:nth-child(1) > div > "
        "div.md-whiteframe-z2.layout-column.flex > md-toolbar > div > div > md-menu:nth-child(3) > span"
    )
    product = (
        "#menu_container_24 > md-menu-content > md-menu-item:nth-child(4) > button"
    )
    cbf = "//md-content[@id='ui-view-container-div']/div/div[3]/div/div/div[3]/div/div/div[2]/span[1]"
    cbf_select = (
        "#ui-view-container-div > div > div.layout-column.flex > div > div > div:nth-child(3) > div > "
        "div > div:nth-child(2) > span.resource-name.flex"
    )
    cbf_resources = (
        "#ui-view-container-div > div > div.layout-column.flex > div > div > div:nth-child(1) > div > "
        "div.md-whiteframe-z2.layout-column.flex > div > div > span.badge"
    )
    antennas = "//md-content[@id='ui-view-container-div']/div/div[3]/div/div/div[3]/div/div/div[9]/span"
    antennas_select = (
        "#ui-view-container-div > div > div.layout-column.flex > div > div > div:nth-child(3) > div >"
        " div > div:nth-child(9) > span.resource-name.flex"
    )
    sdp = '//*[@id="ui-view-container-div"]/div/div[3]/div/div/div[3]/div/div/div[95]/span[1]'
    sdp_select = (
        "#ui-view-container-div > div > div.layout-column.flex > div > div > div:nth-child(3) > div "
        "> div > div:nth-child(95) > span.resource-name.flex"
    )
    initialize = "//md-content[@id='ui-view-container-div']/div/div[3]/div/div/div/div/div[2]/md-toolbar/span[4]"
    initialize_select = (
        "#ui-view-container-div > div > div.layout-column.flex > div > div > div:nth-child(1) > div > "
        "div.md-whiteframe-z2.layout-column.flex > md-toolbar > "
        "span.fa.fa-power-off.subarray-action-icon.hover-opacity.md-ink-ripple"
    )


class Obs:
    manage_obs = (
        "#ui-view-container-div > div > div.hover-opacity.md-whiteframe-z3."
        "layout-align-center-center.layout-row > div:nth-child(5)"
    )

    manage_obs_sel = (
        "#ui-view-container-div > div > div.hover-opacity.md-whiteframe-z3."
        "layout-align-center-center.layout-row > div:nth-child(5) > button"
    )

    obs = (
        "#ui-view-container-div > div > div.hover-opacity.md-whiteframe-z3.layout-align-center-center.layout-row > "
        "div:nth-child(6)"
    )

    approved_obs = "#right-resize > md-toolbar > div"
    approved_sb = "#right-resize > div > div:nth-child(1) > span.icon-button.fa.fa-chevron-left.md-ink-ripple"
    sb_schedule = "#scheduleDraftDataRepeat > div > span.icon-button.fa.fa-chevron-circle-down.md-ink-ripple"
    ellipsis_select = "#bottom-div > div > div > div > div > md-menu > span"
    dry_run = "#menu_container_265 > md-menu-content > md-menu-item:nth-child(2) > button"
    execute = "#bottom-div > div > div > div > div > span.icon-button.fa.md-ink-ripple.fa-play.green-color"
