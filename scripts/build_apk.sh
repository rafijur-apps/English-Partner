#!/usr/bin/env bash
set -e

echo "=== Building English Partner Android APK with Native Audio & TTS ==="

WORK_DIR="/tmp/apk_build"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR/src/com/englishpartner/app"
mkdir -p "$WORK_DIR/res/drawable"
mkdir -p "$WORK_DIR/res/values"
mkdir -p "$WORK_DIR/assets/www"
mkdir -p "$WORK_DIR/bin"
mkdir -p "$WORK_DIR/gen"

# 1. Compile web app bundle
echo "1. Compiling web application..."
npm run build
cp -r dist/* "$WORK_DIR/assets/www/"

# Ensure relative asset paths work inside Android WebView file:///android_asset/
sed -i 's|="/assets/|="./assets/|g' "$WORK_DIR/assets/www/index.html"
sed -i 's|href="/|href="./|g' "$WORK_DIR/assets/www/index.html"
sed -i 's|src="/|src="./|g' "$WORK_DIR/assets/www/index.html"

# 2. Write AndroidManifest.xml
cat << 'EOF' > "$WORK_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.englishpartner.app"
    android:versionCode="2"
    android:versionName="1.1">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:label="English Partner"
        android:icon="@drawable/ic_launcher"
        android:theme="@android:style/Theme.NoTitleBar"
        android:hardwareAccelerated="true">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 3. Create simple strings.xml and copy icon
cat << 'EOF' > "$WORK_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">English Partner</string>
</resources>
EOF

cp public/pwa-192x192.png "$WORK_DIR/res/drawable/ic_launcher.png"

# 4. Write MainActivity.java with native TextToSpeech engine
cat << 'EOF' > "$WORK_DIR/src/com/englishpartner/app/MainActivity.java"
package com.englishpartner.app;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.webkit.JavascriptInterface;
import android.view.Window;
import android.speech.tts.TextToSpeech;
import java.util.Locale;

public class MainActivity extends Activity implements TextToSpeech.OnInitListener {
    private WebView mWebView;
    private TextToSpeech mTTS;
    private boolean mTTSReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        mTTS = new TextToSpeech(this, this);

        mWebView = new WebView(this);
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        mWebView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void speak(String text, float rate) {
                if (mTTS != null && mTTSReady) {
                    mTTS.setSpeechRate(rate);
                    mTTS.speak(text, TextToSpeech.QUEUE_FLUSH, null, "ep_utterance");
                }
            }

            @JavascriptInterface
            public void stop() {
                if (mTTS != null) {
                    mTTS.stop();
                }
            }

            @JavascriptInterface
            public boolean isReady() {
                return mTTSReady;
            }
        }, "AndroidTTS");

        mWebView.setWebViewClient(new WebViewClient());
        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                request.grant(request.getResources());
            }
        });

        mWebView.loadUrl("file:///android_asset/www/index.html");
        setContentView(mWebView);
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            int result = mTTS.setLanguage(Locale.US);
            if (result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) {
                mTTSReady = true;
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (mWebView != null && mWebView.canGoBack()) {
            mWebView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (mTTS != null) {
            mTTS.stop();
            mTTS.shutdown();
        }
        super.onDestroy();
    }
}
EOF

ANDROID_JAR="/tmp/android.jar"
if [ ! -f "$ANDROID_JAR" ]; then
    echo "Using system libandroid-23-java..."
    ANDROID_JAR="/usr/share/java/android-23.jar"
fi

echo "2. Compiling resources with aapt..."
aapt package -f \
    -m \
    -J "$WORK_DIR/gen" \
    -M "$WORK_DIR/AndroidManifest.xml" \
    -S "$WORK_DIR/res" \
    -A "$WORK_DIR/assets" \
    -I "$ANDROID_JAR" \
    -F "$WORK_DIR/bin/app-resources.apk"

echo "3. Compiling Java code with javac..."
javac -source 1.8 -target 1.8 \
    -bootclasspath "$ANDROID_JAR" \
    -d "$WORK_DIR/bin" \
    "$WORK_DIR/gen/com/englishpartner/app/R.java" \
    "$WORK_DIR/src/com/englishpartner/app/MainActivity.java"

echo "4. Converting bytecode to classes.dex with dalvik-exchange..."
dalvik-exchange --dex --output="$WORK_DIR/bin/classes.dex" "$WORK_DIR/bin"

echo "5. Adding classes.dex to APK package..."
cd "$WORK_DIR/bin"
aapt add app-resources.apk classes.dex
cd - > /dev/null

echo "6. Aligning APK with zipalign..."
zipalign -f -p 4 "$WORK_DIR/bin/app-resources.apk" "$WORK_DIR/bin/app-aligned.apk"

echo "7. Signing APK with apksigner using debug.keystore..."
apksigner sign \
    --ks debug.keystore \
    --ks-pass pass:android \
    --ks-key-alias androiddebugkey \
    --key-pass pass:android \
    --out public/EnglishPartner.apk \
    "$WORK_DIR/bin/app-aligned.apk"

echo "=== Verifying signed APK ==="
apksigner verify public/EnglishPartner.apk

ls -lh public/EnglishPartner.apk
echo "APK successfully built with Native Android Audio TTS at public/EnglishPartner.apk!"
