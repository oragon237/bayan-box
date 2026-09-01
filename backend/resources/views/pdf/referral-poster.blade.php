<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>HABI Referral — {{ $hub->name }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1f2937; }
        .poster { max-width: 680px; margin: 0 auto; padding: 40px 32px; text-align: center; }
        .brand { font-size: 44px; font-weight: 900; color: #673de6; letter-spacing: -1px; }
        .brand span { color: #f59e0b; }
        .brand img { height: 64px; width: auto; vertical-align: middle; margin-right: 10px; }
        .tagline { font-size: 16px; color: #6b7280; margin-top: 4px; }
        .hub-card { margin-top: 24px; border: 3px solid #673de6; border-radius: 16px; padding: 24px; }
        .hub-name { font-size: 26px; font-weight: 800; }
        .hub-addr { font-size: 14px; color: #6b7280; margin-top: 4px; }
        .qr-wrap { margin: 24px auto 8px; width: 300px; }
        .qr-wrap img { width: 100%; height: auto; border-radius: 8px; }
        .scan-label { font-size: 13px; letter-spacing: 2px; text-transform: uppercase; color: #374151; }
        .steps { display: flex; justify-content: space-between; gap: 8px; margin-top: 24px; }
        .step { flex: 1; background: #f9fafb; border-radius: 12px; padding: 14px 8px; font-size: 12px; color: #4b5563; }
        .step b { display: block; font-size: 15px; color: #111827; margin-bottom: 4px; }
        .footer { margin-top: 24px; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="poster">
        <div class="brand">
            @if(!empty($logoDataUrl))
                <img src="{{ $logoDataUrl }}" alt="HABI">
            @endif
            HABI
        </div>
        <div class="tagline">Local stores · Riders · Your community</div>

        <div class="hub-card">
            <div class="hub-name">{{ $hub->name }}</div>
            <div class="hub-addr">{{ $hub->address }} · {{ $hub->municipality ?? 'Provincial' }}</div>

            <div class="qr-wrap">
                @if(!empty($qrDataUrl))
                    <img src="{{ $qrDataUrl }}" alt="Referral QR">
                @else
                    <div>Scan me to sign up: {{ $qrPayload }}</div>
                @endif
            </div>
            <div class="scan-label">Scan to register &amp; earn ₱2.00 credit on every parcel</div>
        </div>

        <div class="steps">
            <div class="step"><b>1. Scan</b>Scan this QR with your phone camera</div>
            <div class="step"><b>2. Register</b>Create your free HABI account</div>
            <div class="step"><b>3. Earn</b>Every parcel you receive supports this store</div>
        </div>

        <div class="footer">HABI · Referral Code: {{ $hub->referral_code }}</div>
    </div>
</body>
</html>
