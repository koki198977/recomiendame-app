export default {
  expo: {
    name: "Recomiéndame",
    slug: "recomiendame-app",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#000000"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "cl.edicloud.recomiendame",
      infoPlist: {
        LSApplicationQueriesSchemes: ["youtube", "vnd.youtube"]
      }
    },
    android: {
      package: "cl.edicloud.recomiendame",
      versionCode: 4,
      permissions: ["android.permission.INTERNET"],
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000"
      },
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "https"
            },
            {
              scheme: "http"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ],
      gradleProperties: {
        "android.useAndroidX": "true",
        "android.enableJetifier": "true"
      },
      // Solución para conflictos de content providers
      config: {
        googleMobileAdsAppId: "ca-app-pub-3940256099942544~3347511713" // ID de prueba, cámbialo si usas AdMob
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    owner: "kokialvarez78",
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: "34.0.0"
          }
        }
      ]
    ]
  }
};
