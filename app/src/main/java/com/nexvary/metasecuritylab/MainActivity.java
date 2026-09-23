package com.nexvary.metasecuritylab;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final int REQUEST_SAVE_REPORT = 2501;

    private WebView webView;
    private String pendingReport = "";
    private String pendingReportName = "NEXVARY_Meta_Security_Report.txt";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(6, 13, 20));
        getWindow().setNavigationBarColor(Color.rgb(6, 13, 20));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(6, 13, 20));
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        LinearLayout bar = new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(12, 8, 12, 8);
        bar.setBackgroundColor(Color.rgb(10, 21, 31));

        Button back = new Button(this);
        back.setText("رجوع");
        back.setAllCaps(false);
        back.setContentDescription("الرجوع داخل التطبيق");
        back.setOnClickListener(v -> goBackSafely());

        TextView title = new TextView(this);
        title.setText("NEXVARY Meta Security • Stage 250");
        title.setTextColor(Color.WHITE);
        title.setTextSize(16);
        title.setGravity(Gravity.CENTER_VERTICAL | Gravity.RIGHT);
        title.setPadding(16, 0, 16, 0);

        bar.addView(
                back,
                new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                )
        );
        bar.addView(
                title,
                new LinearLayout.LayoutParams(
                        0,
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        1f
                )
        );

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(6, 13, 20));
        webView.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        WebView.setWebContentsDebuggingEnabled(
                (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0
        );

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(false);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setUserAgentString(
                settings.getUserAgentString() + " NEXVARY-Meta-Security/2.50.0"
        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
        }

        webView.addJavascriptInterface(new NativeBridge(), "NexvaryNative");

        webView.setWebViewClient(new WebViewClient() {
            private boolean isLocal(Uri uri) {
                if (uri == null || uri.getScheme() == null) {
                    return false;
                }
                String scheme = uri.getScheme();
                return "file".equals(scheme)
                        || "data".equals(scheme)
                        || "about".equals(scheme);
            }

            @Override
            public boolean shouldOverrideUrlLoading(
                    WebView view,
                    WebResourceRequest request
            ) {
                return !isLocal(request.getUrl());
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(
                    WebView view,
                    WebResourceRequest request
            ) {
                if (!isLocal(request.getUrl())) {
                    return new WebResourceResponse(
                            "text/plain",
                            "UTF-8",
                            403,
                            "Offline training boundary",
                            null,
                            new ByteArrayInputStream(
                                    "Blocked by offline training boundary"
                                            .getBytes(StandardCharsets.UTF_8)
                            )
                    );
                }
                return super.shouldInterceptRequest(view, request);
            }
        });

        root.addView(
                bar,
                new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        LinearLayout.LayoutParams.WRAP_CONTENT
                )
        );
        root.addView(
                webView,
                new LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.MATCH_PARENT,
                        0,
                        1f
                )
        );

        setContentView(root);
        webView.loadUrl("file:///android_asset/index.html");
    }

    private class NativeBridge {
        @JavascriptInterface
        public void shareText(String title, String content) {
            final String safeTitle =
                    title == null ? "NEXVARY Meta Security Report" : title;
            final String safeContent = content == null ? "" : content;

            runOnUiThread(() -> {
                Intent sendIntent = new Intent(Intent.ACTION_SEND);
                sendIntent.setType("text/plain");
                sendIntent.putExtra(Intent.EXTRA_SUBJECT, safeTitle);
                sendIntent.putExtra(Intent.EXTRA_TEXT, safeContent);
                startActivity(
                        Intent.createChooser(
                                sendIntent,
                                "Share training report"
                        )
                );
            });
        }

        @JavascriptInterface
        public void saveText(String fileName, String content) {
            pendingReport = content == null ? "" : content;
            pendingReportName = sanitizeFileName(fileName);

            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("text/plain");
                intent.putExtra(Intent.EXTRA_TITLE, pendingReportName);
                startActivityForResult(intent, REQUEST_SAVE_REPORT);
            });
        }

        @JavascriptInterface
        public String appVersion() {
            return currentVersion();
        }

        private String sanitizeFileName(String name) {
            String value =
                    name == null || name.trim().isEmpty()
                            ? "NEXVARY_Meta_Security_Report.txt"
                            : name.trim();

            value = value.replaceAll("[\\/:*?\"<>|]", "_");

            if (!value.toLowerCase().endsWith(".txt")) {
                value += ".txt";
            }
            return value;
        }
    }

    @Override
    protected void onActivityResult(
            int requestCode,
            int resultCode,
            Intent data
    ) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode != REQUEST_SAVE_REPORT
                || resultCode != RESULT_OK
                || data == null) {
            return;
        }

        Uri uri = data.getData();
        if (uri == null) {
            return;
        }

        try (OutputStream out =
                     getContentResolver().openOutputStream(uri, "w")) {
            if (out == null) {
                throw new IllegalStateException(
                        "Unable to open output stream"
                );
            }
            out.write(pendingReport.getBytes(StandardCharsets.UTF_8));
            out.flush();

            Toast.makeText(
                    this,
                    "تم حفظ تقرير NEXVARY",
                    Toast.LENGTH_SHORT
            ).show();
        } catch (Exception e) {
            Toast.makeText(
                    this,
                    "تعذر حفظ التقرير",
                    Toast.LENGTH_LONG
            ).show();
        }
    }

    private String currentVersion() {
        try {
            String version =
                    getPackageManager()
                            .getPackageInfo(getPackageName(), 0)
                            .versionName;
            return version == null ? "2.50.0" : version;
        } catch (Exception e) {
            return "2.50.0";
        }
    }

    private void goBackSafely() {
        if (webView == null) {
            return;
        }

        webView.evaluateJavascript(
                "(window.NEXVARY_BACK && window.NEXVARY_BACK())"
                        + " ? 'handled' : 'home';",
                value -> {
                    if (!"\"handled\"".equals(value)) {
                        Toast.makeText(
                                this,
                                "أنت في الصفحة الرئيسية",
                                Toast.LENGTH_SHORT
                        ).show();
                    }
                }
        );
    }

    @Override
    public void onBackPressed() {
        goBackSafely();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("NexvaryNative");
            webView.stopLoading();
            webView.loadUrl("about:blank");
            webView.clearHistory();
            webView.removeAllViews();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
