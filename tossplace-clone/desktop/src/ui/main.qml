import QtQuick
import QtQuick.Controls
import QtQuick.Window
import "pages"
import "styles"

Window {
    id: mainWindow
    title: "Tossplace POS - 데스크톱"
    width: 1200
    height: 800
    visible: true

    color: TossTheme.backgroundColor

    Component.onCompleted: {
        appController.initialize()
    }

    // Main content area
    Rectangle {
        anchors.fill: parent
        color: TossTheme.backgroundColor

        // Header
        Rectangle {
            id: header
            width: parent.width
            height: 60
            color: TossTheme.primaryColor

            Text {
                anchors.left: parent.left
                anchors.leftMargin: 20
                anchors.verticalCenter: parent.verticalCenter
                text: "Tossplace POS 시스템"
                font.pixelSize: 24
                font.bold: true
                color: TossTheme.textColorLight
            }

            Text {
                anchors.right: parent.right
                anchors.rightMargin: 20
                anchors.verticalCenter: parent.verticalCenter
                text: new Date().toLocaleString(Qt.locale(), "HH:mm:ss")
                font.pixelSize: 14
                color: TossTheme.textColorLight

                Timer {
                    interval: 1000
                    running: true
                    repeat: true
                    onTriggered: parent.text = new Date().toLocaleString(Qt.locale(), "HH:mm:ss")
                }
            }
        }

        // Content area with navigation
        Rectangle {
            anchors.top: header.bottom
            anchors.left: parent.left
            anchors.right: parent.right
            anchors.bottom: parent.bottom
            color: TossTheme.backgroundColor

            // Navigation sidebar
            Rectangle {
                id: sidebar
                width: 250
                anchors.top: parent.top
                anchors.bottom: parent.bottom
                anchors.left: parent.left
                color: TossTheme.surfaceColor
                border.color: TossTheme.borderColor
                border.width: 1

                Column {
                    anchors.top: parent.top
                    anchors.topMargin: 20
                    width: parent.width
                    spacing: 10

                    NavButton {
                        width: parent.width - 20
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "🏠 주문 관리"
                        selected: true
                    }

                    NavButton {
                        width: parent.width - 20
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "💰 결제"
                    }

                    NavButton {
                        width: parent.width - 20
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "📦 상품 관리"
                    }

                    NavButton {
                        width: parent.width - 20
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "👥 고객 관리"
                    }

                    NavButton {
                        width: parent.width - 20
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "🚚 배달 연동"
                    }

                    NavButton {
                        width: parent.width - 20
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "🖥️ 키오스크"
                    }

                    NavButton {
                        width: parent.width - 20
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "📊 분석"
                    }

                    NavButton {
                        width: parent.width - 20
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "⚙️ 설정"
                    }
                }
            }

            // Main content area
            Rectangle {
                anchors.top: parent.top
                anchors.bottom: parent.bottom
                anchors.left: sidebar.right
                anchors.right: parent.right
                color: TossTheme.backgroundColor

                // Placeholder for page content
                Text {
                    anchors.centerIn: parent
                    text: "Tossplace POS 시스템에 오신 것을 환영합니다.\n좌측 메뉴에서 원하는 기능을 선택하세요."
                    font.pixelSize: 18
                    color: TossTheme.textColorSecondary
                    horizontalAlignment: Text.AlignHCenter
                }
            }
        }
    }
}

// Navigation button component
Component {
    id: navButtonComp
    Rectangle {
        id: navButton
        property string text: ""
        property bool selected: false

        height: 50
        color: selected ? TossTheme.primaryColor : TossTheme.surfaceColor
        border.color: TossTheme.borderColor
        border.width: 1

        Text {
            anchors.left: parent.left
            anchors.leftMargin: 15
            anchors.verticalCenter: parent.verticalCenter
            text: navButton.text
            font.pixelSize: 14
            color: selected ? TossTheme.textColorLight : TossTheme.textColor

            Behavior on color {
                ColorAnimation { duration: 200 }
            }
        }

        MouseArea {
            anchors.fill: parent
            onClicked: navButton.selected = true
            hoverEnabled: true
        }

        Behavior on color {
            ColorAnimation { duration: 200 }
        }
    }
}

Item { id: NavButton }
