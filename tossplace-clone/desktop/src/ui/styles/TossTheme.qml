pragma Singleton
import QtQuick

QtObject {
    id: tossTheme

    // Toss Brand Colors
    readonly property color primaryColor: "#0052CC"       // Toss Blue
    readonly property color secondaryColor: "#6C757D"     // Gray
    readonly property color accentColor: "#FF6B35"        // Orange (for alerts)
    readonly property color successColor: "#28A745"       // Green
    readonly property color dangerColor: "#DC3545"        // Red
    readonly property color warningColor: "#FFC107"       // Yellow

    // Background and Surface Colors
    readonly property color backgroundColor: "#FAFBFC"
    readonly property color surfaceColor: "#FFFFFF"
    readonly property color borderColor: "#E1E4E8"

    // Text Colors
    readonly property color textColor: "#24292E"
    readonly property color textColorSecondary: "#586069"
    readonly property color textColorLight: "#FFFFFF"
    readonly property color textColorDisabled: "#D1D5DA"

    // Semantic Colors
    readonly property color errorColor: "#CB2431"
    readonly property color infoColor: "#0366D6"

    // Spacing
    readonly property int spacing: 8
    readonly property int spacingSmall: 4
    readonly property int spacingMedium: 12
    readonly property int spacingLarge: 16
    readonly property int spacingXLarge: 24

    // Border Radius
    readonly property int radiusSmall: 4
    readonly property int radiusMedium: 8
    readonly property int radiusLarge: 12

    // Font Sizes
    readonly property int fontSizeSmall: 12
    readonly property int fontSizeMedium: 14
    readonly property int fontSizeLarge: 16
    readonly property int fontSizeXLarge: 20
    readonly property int fontSizeTitle: 24

    // Font Families
    readonly property string fontFamily: "Segoe UI, Arial, sans-serif"
    readonly property string fontFamilyMono: "Consolas, Monaco, monospace"

    // Shadow
    readonly property color shadowColor: "#00000010"
    readonly property int shadowRadius: 4

    // Transitions
    readonly property int transitionDuration: 200

    // Component Specific
    readonly property int buttonHeight: 40
    readonly property int buttonHeightSmall: 32
    readonly property int inputHeight: 40

    // Toss Brand Font Styling
    function titleStyle() {
        return {
            "font.pixelSize": fontSizeTitle,
            "font.family": fontFamily,
            "font.bold": true,
            "color": textColor
        }
    }

    function headingStyle() {
        return {
            "font.pixelSize": fontSizeXLarge,
            "font.family": fontFamily,
            "font.weight": Font.DemiBold,
            "color": textColor
        }
    }

    function bodyStyle() {
        return {
            "font.pixelSize": fontSizeMedium,
            "font.family": fontFamily,
            "color": textColor
        }
    }

    function captionStyle() {
        return {
            "font.pixelSize": fontSizeSmall,
            "font.family": fontFamily,
            "color": textColorSecondary
        }
    }
}
