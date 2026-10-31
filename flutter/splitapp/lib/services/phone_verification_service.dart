import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;

/// Verification challenge created by the central backend.
class VerificationChallenge {
  final String challengeId;
  final String whatsappUrl;
  final String e164;
  final DateTime expiresAt;

  const VerificationChallenge({
    required this.challengeId,
    required this.whatsappUrl,
    required this.e164,
    required this.expiresAt,
  });

  factory VerificationChallenge.fromJson(Map<String, dynamic> json) {
    return VerificationChallenge(
      challengeId: json['challengeId'] as String,
      whatsappUrl: json['whatsappUrl'] as String,
      e164: json['e164'] as String,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
    );
  }
}

/// Verification status polled from the backend.
class VerificationStatusResult {
  final bool success;
  final String challengeId;
  final String status; // 'pending' | 'verified' | 'expired' | 'cancelled' | 'not_found'
  final String? phoneNumber;
  final DateTime? verifiedAt;
  final DateTime? expiresAt;
  final String? error;

  const VerificationStatusResult({
    required this.success,
    required this.challengeId,
    required this.status,
    this.phoneNumber,
    this.verifiedAt,
    this.expiresAt,
    this.error,
  });

  bool get isVerified => status.toLowerCase() == 'verified';
  bool get isExpired => status.toLowerCase() == 'expired';
  bool get isPending => status.toLowerCase() == 'pending';
  bool get isCancelled => status.toLowerCase() == 'cancelled';

  factory VerificationStatusResult.fromJson(Map<String, dynamic> json) {
    return VerificationStatusResult(
      success: json['success'] as bool? ?? false,
      challengeId: json['challengeId'] as String? ?? '',
      status: (json['status'] as String? ?? 'unknown').toLowerCase(),
      phoneNumber: json['phoneNumber'] as String?,
      verifiedAt: json['verifiedAt'] != null
          ? DateTime.tryParse(json['verifiedAt'] as String)
          : null,
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'] as String)
          : null,
      error: json['error'] as String?,
    );
  }
}

/// Production-ready service connecting Flutter apps to the Zero-Cost WhatsApp Phone Verification backend.
class PhoneVerificationService {
  static const String defaultBaseUrl = 'http://localhost:3000';

  final String baseUrl;
  final http.Client _client;

  PhoneVerificationService({
    this.baseUrl = defaultBaseUrl,
    http.Client? client,
  }) : _client = client ?? http.Client();

  /// Step 2: Creates a new verification challenge.
  /// Calls POST /api/phone-verification/challenges
  Future<VerificationChallenge> createChallenge({
    required String rawPhone,
    String countryCode = '91',
    String? userId,
  }) async {
    final url = Uri.parse('$baseUrl/api/phone-verification/challenges');
    final payload = <String, dynamic>{
      'phone': rawPhone,
      'countryCode': countryCode,
    };
    if (userId != null) {
      payload['userId'] = userId;
    }

    final response = await _client.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(payload),
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 200 && response.statusCode < 300 && data['success'] == true) {
      return VerificationChallenge.fromJson(data);
    }

    final errorMsg = data['error'] as String? ?? 'Failed to create verification challenge';
    throw Exception(errorMsg);
  }

  /// Step 6: Single status check.
  /// Calls GET /api/phone-verification/challenges/:id
  Future<VerificationStatusResult> checkStatus(String challengeId) async {
    final url = Uri.parse('$baseUrl/api/phone-verification/challenges/$challengeId');
    final response = await _client.get(
      url,
      headers: {'Accept': 'application/json'},
    );

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return VerificationStatusResult.fromJson(data);
  }

  /// Cancels an active challenge.
  /// Calls POST /api/phone-verification/challenges/:id/cancel
  Future<bool> cancelChallenge(String challengeId) async {
    try {
      final url = Uri.parse('$baseUrl/api/phone-verification/challenges/$challengeId/cancel');
      final response = await _client.post(
        url,
        headers: {'Content-Type': 'application/json'},
      );
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return data['success'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Reactive status polling stream. Emits [VerificationStatusResult] every [pollInterval]
  /// until verified, expired, cancelled, or [timeout] elapsed.
  Stream<VerificationStatusResult> pollStatus(
    String challengeId, {
    Duration pollInterval = const Duration(seconds: 2),
    Duration timeout = const Duration(minutes: 5),
  }) async* {
    final stopwatch = Stopwatch()..start();

    while (stopwatch.elapsed < timeout) {
      try {
        final result = await checkStatus(challengeId);
        yield result;

        if (result.isVerified || result.isExpired || result.isCancelled) {
          break;
        }
      } catch (err) {
        yield VerificationStatusResult(
          success: false,
          challengeId: challengeId,
          status: 'error',
          error: err.toString(),
        );
      }

      await Future.delayed(pollInterval);
    }
  }

  void dispose() {
    _client.close();
  }
}

