import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/calculations.dart';
import '../models/split_types.dart';

/// Service for calculating bills via the Next.js /api/calculate endpoint.
/// Gracefully falls back to local [calculateBill] if the server is offline or unreachable.
class CalculateApiService {
  static const String defaultBaseUrl = 'http://localhost:3000';

  final String baseUrl;
  final http.Client _client;

  CalculateApiService({
    this.baseUrl = defaultBaseUrl,
    http.Client? client,
  }) : _client = client ?? http.Client();

  /// Computes the bill split by calling POST /api/calculate.
  /// Falls back to local engine if [fallbackToLocal] is true and network fails.
  Future<CalculationResult> calculate(
    Bill bill, {
    bool fallbackToLocal = true,
    Duration timeout = const Duration(seconds: 15),
  }) async {
    try {
      final url = Uri.parse('$baseUrl/api/calculate');
      final res = await _client
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'bill': bill.toJson()}),
          )
          .timeout(timeout);

      final data = jsonDecode(res.body) as Map<String, dynamic>;

      if (res.statusCode >= 200 && res.statusCode < 300 && data['ok'] == true) {
        final resultMap = data['result'] as Map<String, dynamic>;
        return CalculationResult.fromJson(resultMap);
      }

      // If validation error returned by server
      if (data['error'] != null && data['error']['issues'] is List) {
        final issuesList = data['error']['issues'] as List<dynamic>;
        final issues = issuesList
            .map((e) => ValidationIssue.fromJson(e as Map<String, dynamic>))
            .toList();

        return CalculationResult(
          valid: false,
          issues: issues,
          itemsTotal: 0,
          adjustmentsTotal: 0,
          billTotal: 0,
          unassignedValue: 0,
          itemAllocations: const {},
          adjustmentAllocations: const {},
          people: const {},
          settlements: const [],
        );
      }
    } catch (_) {
      if (fallbackToLocal) {
        return calculateBill(bill);
      }
      rethrow;
    }

    if (fallbackToLocal) {
      return calculateBill(bill);
    }
    throw Exception('Failed to calculate bill via API');
  }
}
