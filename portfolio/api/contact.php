<?php
/**
 * Velith Systems - Contact & Inquiry Handler
 * Place inside public_html/api/ on Hostinger.
 * Set RESEND_API_KEY in hosting env (or .env outside public_html). Uses Resend when set.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

$service = htmlspecialchars($input['service'] ?? 'General Consultation', ENT_QUOTES, 'UTF-8');
$name    = htmlspecialchars($input['name'] ?? 'Inquirer', ENT_QUOTES, 'UTF-8');
$email   = filter_var($input['email'] ?? '', FILTER_VALIDATE_EMAIL);
$message = htmlspecialchars($input['message'] ?? 'No message provided', ENT_QUOTES, 'UTF-8');

if (!$email) {
    http_response_code(400);
    echo json_encode(['error' => 'A valid work email is required.']);
    exit;
}

$to = getenv('INQUIRY_TO_EMAIL') ?: 'abhinavd372@gmail.com';
$resendKey = getenv('RESEND_API_KEY') ?: '';
$from = getenv('RESEND_FROM') ?: 'Velith Systems <onboarding@resend.dev>';
$timestamp = date('Y-m-d H:i:s T');
$subject = "Velith Systems: New consultation request from {$name}";

$html = <<<HTML
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #0b1220; color: #e2e8f0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #111827; border-radius: 12px; padding: 28px;">
    <p style="color: #22d3ee; font-size: 12px; text-transform: uppercase;">Velith Systems</p>
    <h1 style="color: #f8fafc;">New consultation request received</h1>
    <p><strong>Name:</strong> {$name}<br>
    <strong>Email:</strong> {$email}<br>
    <strong>Service:</strong> {$service}<br>
    <strong>Time:</strong> {$timestamp}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space: pre-wrap;">{$message}</p>
  </div>
</body>
</html>
HTML;

$text = "Velith Systems: New consultation request received\n\n"
    . "Time: {$timestamp}\nName: {$name}\nEmail: {$email}\nService: {$service}\n\nMessage:\n{$message}\n";

function send_via_resend($apiKey, $payload) {
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
    ]);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$status, $response];
}

if ($resendKey !== '') {
    [$status, $response] = send_via_resend($resendKey, [
        'from' => $from,
        'to' => [$to],
        'reply_to' => $email,
        'subject' => $subject,
        'html' => $html,
        'text' => $text,
    ]);

    if ($status >= 200 && $status < 300) {
        echo json_encode([
            'success' => true,
            'message' => 'Consultation inquiry received successfully.',
        ]);
        exit;
    }

    error_log('Resend failed: ' . $status . ' ' . $response);
    http_response_code(502);
    echo json_encode(['error' => 'Failed to send inquiry email.']);
    exit;
}

// Fallback when RESEND_API_KEY is not set (legacy PHP mail)
$headers = "From: {$from}\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

if (mail($to, $subject, $text, $headers)) {
    echo json_encode([
        'success' => true,
        'message' => 'Consultation inquiry received successfully.',
    ]);
} else {
    error_log("Failed to send email to {$to}");
    http_response_code(502);
    echo json_encode(['error' => 'Failed to send inquiry email.']);
}
