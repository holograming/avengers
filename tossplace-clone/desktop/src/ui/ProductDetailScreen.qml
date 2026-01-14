import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: detailScreen
    anchors.fill: parent
    color: "#f5f5f5"

    signal backClicked()

    // Header
    Rectangle {
        id: header
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: 50
        color: "#ffffff"

        Button {
            anchors.left: parent.left
            anchors.leftMargin: 10
            anchors.verticalCenter: parent.verticalCenter
            text: "← 뒤로"
            onClicked: backClicked()
        }

        Text {
            anchors.centerIn: parent
            text: "상품 상세"
            font.bold: true
            font.pixelSize: 16
        }
    }

    // Scrollable content
    ScrollView {
        anchors.top: header.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        clip: true

        ColumnLayout {
            width: parent.width
            spacing: 20
            padding: 20

            // Product image gallery
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 400
                color: "#eeeeee"
                radius: 5

                Text {
                    anchors.centerIn: parent
                    text: "상품 이미지 갤러리"
                    color: "#999999"
                    font.pixelSize: 14
                }
            }

            // Product info section
            Rectangle {
                Layout.fillWidth: true
                color: "#ffffff"
                border.color: "#dddddd"
                border.width: 1
                radius: 5
                Layout.preferredHeight: 300

                ColumnLayout {
                    anchors.fill: parent
                    anchors.margins: 15
                    spacing: 10

                    // Title
                    Text {
                        text: "상품명"
                        font.bold: true
                        font.pixelSize: 18
                        Layout.fillWidth: true
                    }

                    // Price
                    Text {
                        text: "10,000원"
                        font.bold: true
                        font.pixelSize: 24
                        color: "#FF6B35"
                    }

                    // Rating
                    Row {
                        spacing: 5
                        Text {
                            text: "★★★★★"
                            color: "#FFD700"
                            font.pixelSize: 14
                        }
                        Text {
                            text: "4.5 (120 리뷰)"
                            color: "#666666"
                            font.pixelSize: 12
                        }
                    }

                    // Description
                    Text {
                        text: "상세 설명"
                        font.bold: true
                        font.pixelSize: 14
                    }

                    TextEdit {
                        text: "제품의 상세한 설명이 여기 표시됩니다. 제품의 상태, 사용 기간, 하자 여부 등에 대한 정보를 포함합니다."
                        readOnly: true
                        wrapMode: Text.WordWrap
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        color: "#666666"
                        font.pixelSize: 12
                    }
                }
            }

            // Seller info
            Rectangle {
                Layout.fillWidth: true
                color: "#ffffff"
                border.color: "#dddddd"
                border.width: 1
                radius: 5
                Layout.preferredHeight: 120

                RowLayout {
                    anchors.fill: parent
                    anchors.margins: 15
                    spacing: 15

                    // Seller avatar
                    Rectangle {
                        width: 60
                        height: 60
                        color: "#eeeeee"
                        radius: 30

                        Text {
                            anchors.centerIn: parent
                            text: "프로필"
                            color: "#999999"
                            font.pixelSize: 10
                        }
                    }

                    // Seller info
                    ColumnLayout {
                        Layout.fillWidth: true
                        spacing: 5

                        Text {
                            text: "판매자명"
                            font.bold: true
                            font.pixelSize: 14
                        }

                        Text {
                            text: "판매자 지역"
                            color: "#666666"
                            font.pixelSize: 12
                        }

                        Row {
                            spacing: 10
                            Button {
                                text: "문의하기"
                                Layout.preferredWidth: 100
                            }
                            Button {
                                text: "프로필"
                                Layout.preferredWidth: 100
                            }
                        }
                    }
                }
            }

            // Action buttons
            RowLayout {
                Layout.fillWidth: true
                spacing: 10

                Button {
                    text: "♡ 찜하기"
                    Layout.fillWidth: true
                    Layout.preferredHeight: 50

                    background: Rectangle {
                        color: "#ffffff"
                        border.color: "#FF6B35"
                        border.width: 2
                        radius: 5
                    }

                    contentItem: Text {
                        text: parent.text
                        color: "#FF6B35"
                        font.bold: true
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }

                Button {
                    text: "구매하기"
                    Layout.fillWidth: true
                    Layout.preferredHeight: 50

                    background: Rectangle {
                        color: "#FF6B35"
                        radius: 5
                    }

                    contentItem: Text {
                        text: parent.text
                        color: "#ffffff"
                        font.bold: true
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                }
            }

            Item { Layout.fillHeight: true }
        }
    }
}
