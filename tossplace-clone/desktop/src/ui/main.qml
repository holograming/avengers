import QtQuick
import QtQuick.Window
import QtQuick.Controls

Window {
    id: mainWindow
    width: 1280
    height: 720
    visible: true
    title: "Tossplace Clone"

    color: "#f5f5f5"

    // Main content area
    Rectangle {
        id: contentArea
        anchors.fill: parent
        color: parent.color

        // Loader to switch between screens
        Loader {
            id: screenLoader
            anchors.fill: parent

            Component.onCompleted: {
                // Start with login screen
                sourceComponent: loginScreenComponent
            }
        }

        // Login Screen Component
        Component {
            id: loginScreenComponent
            LoginScreen {
                onLoginSuccessful: {
                    screenLoader.sourceComponent = productListScreenComponent
                }
            }
        }

        // Product List Screen Component
        Component {
            id: productListScreenComponent
            ProductListScreen {
                onProductSelected: function(productId) {
                    detailScreen.productId = productId
                    screenLoader.sourceComponent = productDetailScreenComponent
                }
                onLogoutRequested: {
                    screenLoader.sourceComponent = loginScreenComponent
                }
            }
        }

        // Product Detail Screen Component
        Component {
            id: productDetailScreenComponent
            ProductDetailScreen {
                id: detailScreen
                onBackClicked: {
                    screenLoader.sourceComponent = productListScreenComponent
                }
            }
        }
    }
}
