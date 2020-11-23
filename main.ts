function playSound (value: number) {
    if (!(Silence)) {
        music.playTone(value, music.beat(BeatFraction.Sixteenth))
    }
}
function ErrorHandle (isOK: boolean, OutputErrorInfo: string) {
    if (!(isOK)) {
        I2C_LCD1602.ShowString(OutputErrorInfo, 0, 0)
        basic.pause(2000)
        music.playTone(196, music.beat(BeatFraction.Sixteenth))
        control.reset()
    }
}
input.onButtonPressed(Button.A, function () {
    meidea_ir.initIR(AnalogPin.P8)
    basic.pause(500)
    meidea_ir.sendCode(meidea_ir.getOpenCode(mode_code.Wind, tmp_code.T25, wind_code.Auto))
})
function turnSilence () {
    Silence = !(Silence)
    if (Silence) {
        I2C_LCD1602.BacklightOff()
    } else {
        I2C_LCD1602.BacklightOn()
    }
}
input.onButtonPressed(Button.AB, function () {
    turnSilence()
})
function Login () {
    ESP8266.connectWifi(
    SerialPin.P2,
    SerialPin.P1,
    BaudRate.BaudRate115200,
    "TP-LINK_Mini",
    "0987654323"
    )
    basic.showString("W")
    ErrorHandle(ESP8266.isWifiConnected(), "Conn Wifi Err")
    Bigiot_net.connectToBigiotServer("www.bigiot.net", 8181)
    basic.showString("C")
    ErrorHandle(Bigiot_net.isLastCmdSuccessful(), "Conn Bigiot Err")
    Bigiot_net.checkoutBigiot(Device_ID, APIKEY)
    basic.showString("O")
    ErrorHandle(Bigiot_net.isLastCmdSuccessful(), "Logout Err")
    Bigiot_net.checkinBigiot(Device_ID, APIKEY)
    basic.showString("I")
    ErrorHandle(Bigiot_net.isLastCmdSuccessful(), "Login Err")
    lasttime = 0
}
function showHeart () {
    if (!(Silence)) {
        basic.showIcon(IconNames.Heart)
        basic.clearScreen()
    }
}
function initLCD1602 () {
    I2C_LCD1602.LcdInit(39)
    for (let index = 0; index < 3; index++) {
        I2C_LCD1602.BacklightOff()
        basic.pause(200)
        I2C_LCD1602.BacklightOn()
        basic.pause(200)
    }
    I2C_LCD1602.ShowString("**My AC Ctrl**", 0, 0)
    I2C_LCD1602.ShowString("*****V1.0******", 0, 1)
    for (let index = 0; index < 16; index++) {
        I2C_LCD1602.shr()
        basic.pause(200)
    }
    I2C_LCD1602.clear()
}
function initVar () {
    Silence = false
    Device_ID = "12386"
    APIKEY = "db21ea898"
    Temper_ID = "11381"
    sleeptime = 10000
    beat = 6
    music.playTone(523, music.beat(BeatFraction.Sixteenth))
}
function initOther () {
    basic.showLeds(`
        . . . . .
        . . . . .
        . . # . .
        . . . . .
        . . . . .
        `)
    basic.pause(500)
}
input.onButtonPressed(Button.B, function () {
    meidea_ir.initIR(AnalogPin.P8)
    basic.pause(500)
    meidea_ir.sendCode(meidea_ir.getCloseCode())
})
function showDiamond () {
    if (!(Silence)) {
        basic.showIcon(IconNames.Square)
        basic.clearScreen()
    }
}
function ShowText1602 (text: string) {
    I2C_LCD1602.clear()
    local_len = text.length
    if (local_len <= 16) {
        I2C_LCD1602.ShowString(text, Math.round((16 - local_len) / 2), 0)
    } else {
        I2C_LCD1602.ShowString(text.substr(0, 16), 0, 0)
        I2C_LCD1602.ShowString(text.substr(16, 16), 0, 1)
    }
}
let 命令 = ""
let local_len = 0
let beat = 0
let sleeptime = 0
let Temper_ID = ""
let lasttime = 0
let APIKEY = ""
let Device_ID = ""
let Silence = false
initVar()
initOther()
initLCD1602()
Login()
basic.forever(function () {
    if (control.millis() - lasttime > sleeptime) {
        Bigiot_net.sendBigiotBeat()
        showHeart()
        beat += 1
        lasttime = control.millis()
    }
    if (beat >= 6) {
        ShowText1602("Temp:" + convertToText(input.temperature()))
        Bigiot_net.updateBigiot1(
        Device_ID,
        Temper_ID,
        convertToText(input.temperature())
        )
        showDiamond()
        beat = 0
    }
    if (Bigiot_net.getCommand(500)) {
        命令 = Bigiot_net.lastCmd()
        ShowText1602(命令)
        if (命令 == "onHotAC") {
            playSound(523)
            basic.pause(500)
            meidea_ir.initIR(AnalogPin.P8)
            basic.pause(500)
            for (let index = 0; index < 3; index++) {
                meidea_ir.sendCode(meidea_ir.getOpenCode(mode_code.Heat, tmp_code.T22, wind_code.Mid))
                basic.pause(2000)
            }
        }
        if (命令 == "onColdAC") {
            playSound(523)
            basic.pause(500)
            meidea_ir.initIR(AnalogPin.P8)
            basic.pause(500)
            for (let index = 0; index < 3; index++) {
                meidea_ir.sendCode(meidea_ir.getOpenCode(mode_code.Cold, tmp_code.T25, wind_code.Mid))
                basic.pause(2000)
            }
        }
        if (命令 == "offAC") {
            playSound(523)
            basic.pause(500)
            meidea_ir.initIR(AnalogPin.P8)
            basic.pause(500)
            for (let index = 0; index < 3; index++) {
                meidea_ir.sendCode(meidea_ir.getCloseCode())
                basic.pause(2000)
            }
        }
        if (命令 == "turnSilence") {
            playSound(196)
            turnSilence()
        }
        if (命令 == "playMusic") {
            music.playMelody("E B C5 A B G A F ", 340)
        }
        if (命令 == "reset") {
            playSound(196)
            control.reset()
        }
        if (命令 == "ERROR") {
            playSound(196)
            control.reset()
        }
    }
})
