import QtQuick
import QtQuick.Controls
import QtQuick.Layouts

Rectangle {
    id: productListScreen
    anchors.fill: parent
    color: "#f5f5f5"

    signal productSelected(int productId)
    signal logoutRequested()

    // Header
    Rectangle {
        id: header
        anchors.top: parent.top
        anchors.left: parent.left
        anchors.right: parent.right
        height: 60
        color: "#ffffff"

        RowLayout {
            anchors.fill: parent
            anchors.margins: 10
            spacing: 10

            Text {
                text: "Tossplace"
                font.pixelSize: 20
                font.bold: true
                color: "#000000"
            }

            Item { Layout.fillWidth: true }

            // Search bar
            TextField {
                id: searchInput
                placeholderText: "검색"
                Layout.preferredWidth: 300
                Layout.preferredHeight: 40
                padding: 10

                background: Rectangle {
                    border.color: "#dddddd"
                    border.width: 1
                    radius: 5
                }

                onAccepted: {
                    if (text.length > 0) {
                        productService.searchProducts(text)
                    }
                }
            }

            Button {
                text: "로그아웃"
                Layout.preferredWidth: 80
                onClicked: logoutRequested()

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
    }

    // Category filter
    Rectangle {
        id: filterBar
        anchors.top: header.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        height: 50
        color: "#ffffff"

        Row {
            anchors.fill: parent
            anchors.margins: 10
            spacing: 10

            Button {
                text: "전체"
                width: 60
                height: 30
                onClicked: {
                    productService.loadAllProducts()
                }
            }

            Button {
                text: "전자제품"
                width: 60
                height: 30
                onClicked: {
                    productService.loadProductsByCategory("전자제품")
                }
            }

            Button {
                text: "의류"
                width: 60
                height: 30
                onClicked: {
                    productService.loadProductsByCategory("의류")
                }
            }

            Button {
                text: "도서"
                width: 60
                height: 30
                onClicked: {
                    productService.loadProductsByCategory("도서")
                }
            }

            Button {
                text: "가구"
                width: 60
                height: 30
                onClicked: {
                    productService.loadProductsByCategory("가구")
                }
            }
        }
    }

    // Product grid
    GridView {
        id: productGrid
        anchors.top: filterBar.bottom
        anchors.left: parent.left
        anchors.right: parent.right
        anchors.bottom: parent.bottom
        anchors.margins: 10
        cellWidth: 250
        cellHeight: 350
        clip: true

        model: productModel

        ListModel {
            id: productModel
        }

        delegate: Rectangle {
            width: 240
            height: 340
            color: "#ffffff"
            border.color: "#dddddd"
            border.width: 1
            radius: 5

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 10
                spacing: 5

                // Product image
                Rectangle {
                    Layout.fillWidth: true
                    Layout.preferredHeight: 180
                    color: "#eeeeee"
                    radius: 3

                    Text {
                        anchors.centerIn: parent
                        text: "상품 이미지"
                        color: "#999999"
                    }
                }

                // Product title
                Text {
                    text: model.title || "상품명"
                    font.bold: true
                    font.pixelSize: 14
                    elide: Text.ElideRight
                    Layout.fillWidth: true
                }

                // Product description
                Text {
                    text: model.description || "상품 설명"
                    font.pixelSize: 12
                    color: "#666666"
                    elide: Text.ElideRight
                    maximumLineCount: 2
                    Layout.fillWidth: true
                }

                // Price
                Text {
                    text: (model.price || 0) + "원"
                    font.bold: true
                    font.pixelSize: 16
                    color: "#FF6B35"
                }

                // Region
                Text {
                    text: model.region || "지역"
                    font.pixelSize: 11
                    color: "#999999"
                }

                Item { Layout.fillHeight: true }

                // Click area
                MouseArea {
                    anchors.fill: parent
                    onClicked: {
                        productSelected(model.id)
                    }
                }
            }
        }
    }

    // Signal connections
    Connections {
        target: productService
        function onProductsLoaded(products) {
            productModel.clear()
            for (var i = 0; i < products.length; i++) {
                productModel.append(products[i])
            }
        }
    }

    Component.onCompleted: {
        // Load all products on screen load
        productService.loadAllProducts()
    }
}
