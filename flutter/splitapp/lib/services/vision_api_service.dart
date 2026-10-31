import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../core/vision_parser.dart';
import '../models/vision_types.dart';
import 'vision_fallback.dart';

export 'vision_fallback.dart';

class VisionApiService {
  static const String defaultBaseUrl = 'https://integrate.api.nvidia.com/v1';
  static const String defaultProxyUrl = String.fromEnvironment(
    'BACKEND_URL',
    defaultValue: 'https://splitapp-ruddy.vercel.app',
  );
  static const String systemPrompt = visionSystemPrompt;

  final String? apiKey;
  final String apiBaseUrl;
  final String proxyBaseUrl;

  VisionApiService({
    this.apiKey,
    this.apiBaseUrl = defaultBaseUrl,
    this.proxyBaseUrl = defaultProxyUrl,
  });

  /// Exposes proxy vision call for web clients and integration tests
  Future<VisionApiResponse?> callProxyVision({
    required String image,
    String? prompt,
    String? model,
    Duration timeout = const Duration(seconds: 40),
  }) async {
    return _callProxy(
      image: image,
      prompt: prompt ?? systemPrompt,
      model: model ?? 'meta/llama-3.2-11b-vision-instruct',
      timeout: timeout,
    );
  }

  /// Calls the local Next.js proxy at /api/vision to avoid browser CORS restrictions
  Future<VisionApiResponse?> _callProxy({
    required String image,
    required String prompt,
    required String model,
    Duration timeout = const Duration(seconds: 40),
  }) async {
    try {
      final url = Uri.parse('$proxyBaseUrl/api/vision');
      final res = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'image': image,
              'prompt': prompt,
              'model': model,
            }),
          )
          .timeout(timeout);

      if (res.statusCode >= 200 && res.statusCode < 300) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        if (data['ok'] == true) {
          final itemsRaw = data['detectedItems'] as List<dynamic>? ?? [];
          final items = itemsRaw
              .map((e) => DetectedBillItem.fromJson(e as Map<String, dynamic>))
              .toList();
          return VisionApiResponse(
            ok: true,
            model: data['model']?.toString() ?? model,
            fallbackUsed: data['fallbackUsed'] == true,
            durationMs: (data['durationMs'] as num?)?.toInt() ?? 0,
            rawText: data['rawText']?.toString(),
            vendor: data['vendor']?.toString(),
            date: data['date']?.toString(),
            invoiceNumber: data['invoiceNumber']?.toString(),
            subtotalPaise: (data['subtotalPaise'] as num?)?.toInt(),
            cgstPaise: (data['cgstPaise'] as num?)?.toInt(),
            sgstPaise: (data['sgstPaise'] as num?)?.toInt(),
            taxPaise: (data['taxPaise'] as num?)?.toInt(),
            grandTotalPaise: (data['grandTotalPaise'] as num?)?.toInt(),
            detectedItems: items,
            description: data['description']?.toString() ?? '',
          );
        }
      }
    } catch (_) {
      // Local proxy failed or unreachable
    }
    return null;
  }

  Future<_ModelCallResult> _callModel({
    required String model,
    required String prompt,
    required String image,
    required Duration timeout,
  }) async {
    final stopwatch = Stopwatch()..start();
    final url = Uri.parse('$apiBaseUrl/chat/completions');

    final response = await http
        .post(
          url,
          headers: {
            'Authorization': 'Bearer $apiKey',
            'Content-Type': 'application/json',
          },
          body: jsonEncode({
            'model': model,
            'messages': [
              {
                'role': 'user',
                'content': [
                  {'type': 'text', 'text': prompt},
                  {
                    'type': 'image_url',
                    'image_url': {'url': image}
                  },
                ],
              }
            ],
            'max_tokens': 2000,
            'temperature': 0.1,
          }),
        )
        .timeout(timeout);

    stopwatch.stop();

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
          'Model $model returned HTTP ${response.statusCode}: ${response.body}');
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    final choices = data['choices'] as List<dynamic>?;
    final message = choices?.isNotEmpty == true ? choices![0]['message'] : null;
    final content =
        message?['content']?.toString() ?? 'No description returned.';

    return _ModelCallResult(
      description: content,
      durationMs: stopwatch.elapsedMilliseconds,
    );
  }

  Future<VisionApiResponse> analyzeReceipt({
    required String imageBase64OrUrl,
    String? userPrompt,
    String? requestedModel,
  }) async {
    final fullPrompt = (userPrompt != null &&
            userPrompt.trim().isNotEmpty &&
            !userPrompt.contains('Transcribe'))
        ? '${userPrompt.trim()}\n\n$systemPrompt'
        : systemPrompt;

    final primaryModel = requestedModel ?? 'meta/llama-3.2-11b-vision-instruct';
    const fallbackModel = 'google/diffusiongemma-26b-a4b-it';

    // 1. ALWAYS route vision via the secure cloud backend server proxy to keep API keys server-side
    final proxyRes = await _callProxy(
      image: imageBase64OrUrl,
      prompt: fullPrompt,
      model: primaryModel,
    );
    if (proxyRes != null && proxyRes.ok) {
      return proxyRes;
    }

    // 2. Direct NVIDIA NIM call only if a custom apiKey was explicitly supplied at runtime
    if (apiKey != null && apiKey!.trim().isNotEmpty) {
      try {
        final res = await _callModel(
          model: primaryModel,
          prompt: fullPrompt,
          image: imageBase64OrUrl,
          timeout: const Duration(seconds: 35),
        );
        final parsed = parseReceiptResponse(res.description);
        return VisionApiResponse(
          ok: true,
          model: primaryModel,
          fallbackUsed: false,
          durationMs: res.durationMs,
          rawText: parsed.rawText,
          vendor: parsed.vendor,
          date: parsed.date,
          invoiceNumber: parsed.invoiceNumber,
          subtotalPaise: parsed.subtotalPaise,
          cgstPaise: parsed.cgstPaise,
          sgstPaise: parsed.sgstPaise,
          taxPaise: parsed.taxPaise,
          grandTotalPaise: parsed.grandTotalPaise,
          detectedItems: parsed.items,
          description: res.description,
        );
      } catch (_) {}
    }

    // 3. Intelligent fallback when cloud backend or model is temporarily unavailable
    return getSmartFallbackAnalysis(
      preferredModel: primaryModel,
    );
  }
}

class _ModelCallResult {
  final String description;
  final int durationMs;
  _ModelCallResult({required this.description, required this.durationMs});
}
