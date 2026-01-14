import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: loginScreen
    anchors.fill: parent
    color: "#ffffff"

    signal loginSuccessful()

    ColumnLayout {
        anchors.centerIn: parent
        width: 400
        spacing: 20

        // Title
        Text {
            text: "Tossplace"
            font.pixelSize: 32
            font.bold: true
            color: "#000000"
            Layout.alignment: Qt.AlignHCenter
        }

        Text {
            text: "로그인"
            font.pixelSize: 20
            color: "#666666"
            Layout.alignment: Qt.AlignHCenter
        }

        // Email input
        TextField {
            id: emailInput
            placeholderText: "Email"
            Layout.fillWidth: true
            Layout.preferredHeight: 50
            padding: 10
            font.pixelSize: 14

            background: Rectangle {
                border.color: "#dddddd"
                border.width: 1
                radius: 5
            }
        }

        // Password input
        TextField {
            id: passwordInput
            placeholderText: "Password"
            echoMode: TextInput.Password
            Layout.fillWidth: true
            Layout.preferredHeight: 50
            padding: 10
            font.pixelSize: 14

            background: Rectangle {
                border.color: "#dddddd"
                border.width: 1
                radius: 5
            }
        }

        // Login button
        Button {
            text: "로그인"
            Layout.fillWidth: true
            Layout.preferredHeight: 50
            font.pixelSize: 14
            font.bold: true

            background: Rectangle {
                color: "#FF6B35"
                radius: 5
            }

            contentItem: Text {
                text: parent.text
                color: "#ffffff"
                font: parent.font
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }

            onClicked: {
                if (emailInput.text.isEmpty() || passwordInput.text.isEmpty()) {
                    errorMessage.text = "Email and password are required"
                    return
                }
                authService.login(emailInput.text, passwordInput.text)
            }
        }

        // Error message
        Text {
            id: errorMessage
            color: "#FF0000"
            font.pixelSize: 12
            Layout.alignment: Qt.AlignHCenter
            visible: text.length > 0
        }

        // Separator
        Rectangle {
            Layout.fillWidth: true
            height: 1
            color: "#dddddd"
        }

        // Register link
        Text {
            text: "계정이 없으신가요? 회원가입"
            color: "#FF6B35"
            font.pixelSize: 12
            Layout.alignment: Qt.AlignHCenter

            MouseArea {
                anchors.fill: parent
                onClicked: {
                    // TODO: Navigate to register screen
                }
            }
        }
    }

    // Signal connections
    Connections {
        target: authService
        function onLoginSuccess(username) {
            loginSuccessful()
        }
        function onLoginFailed(message) {
            errorMessage.text = message
        }
    }
}
