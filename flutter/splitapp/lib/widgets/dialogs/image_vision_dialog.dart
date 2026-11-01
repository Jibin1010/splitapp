import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../../models/vision_types.dart';
import '../../services/vision_api_service.dart';
import '../../state/bill_state.dart';
import 'vision/vision_dialog_header.dart';
import 'vision/vision_dialog_models.dart';
import 'vision/vision_model_selector.dart';
import 'vision/vision_results_panel.dart';
import 'vision/vision_upload_area.dart';

export 'vision/vision_detected_items_tab.dart';
export 'vision/vision_dialog_header.dart';
export 'vision/vision_dialog_models.dart';
export 'vision/vision_gst_section.dart';
export 'vision/vision_heads_tails.dart';
export 'vision/vision_import_footer.dart';
export 'vision/vision_import_helper.dart';
export 'vision/vision_item_assignment_sheet.dart';
export 'vision/vision_model_selector.dart';
export 'vision/vision_people_section.dart';
export 'vision/vision_products_table.dart';
export 'vision/vision_results_panel.dart';
export 'vision/vision_text_tabs.dart';
export 'vision/vision_upload_area.dart';

class ImageVisionDialog extends StatefulWidget {
  final BillState state;
  final VisionApiService visionService;

  const ImageVisionDialog({
    super.key,
    required this.state,
    required this.visionService,
  });

  @override
  State<ImageVisionDialog> createState() => _ImageVisionDialogState();
}

class _ImageVisionDialogState extends State<ImageVisionDialog> {
  String? _imageBytesBase64;
  Uint8List? _imageRawBytes;
  String _imageName = '';
  String _selectedModel = 'google/diffusiongemma-26b-a4b-it';
  String _selectedPromptId = 'detailed';
  bool _loading = false;
  int _elapsedSeconds = 0;
  Timer? _timer;
  VisionApiResponse? _result;
  List<DetectedBillItem> _itemsList = [];
  int _activeTab = 0; // 0: products, 1: raw_text, 2: details

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _elapsedSeconds = 0;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      setState(() => _elapsedSeconds += 1);
    });
  }

  void _stopTimer() {
    _timer?.cancel();
  }

  Future<void> _pickImage() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['png', 'jpg', 'jpeg', 'webp'],
      withData: true,
    );
    if (result != null && result.files.isNotEmpty) {
      final file = result.files.first;
      Uint8List? rawBytes = file.bytes;
      if (rawBytes == null && file.path != null) {
        rawBytes = await File(file.path!).readAsBytes();
      }
      if (rawBytes != null) {
        final b64 = 'data:image/jpeg;base64,${base64Encode(rawBytes)}';
        setState(() {
          _imageRawBytes = rawBytes;
          _imageBytesBase64 = b64;
          _imageName = file.name;
          _result = null;
          _itemsList = [];
        });
      }
    }
  }

  void _handleAnalyze() async {
    if (_imageBytesBase64 == null) return;
    setState(() {
      _loading = true;
      _result = null;
      _itemsList = [];
    });
    _startTimer();

    final activePrompt = presetVisionPrompts
        .firstWhere((p) => p.id == _selectedPromptId, orElse: () => presetVisionPrompts[0])
        .prompt;

    try {
      final res = await widget.visionService.analyzeReceipt(
        imageBase64OrUrl: _imageBytesBase64!,
        userPrompt: activePrompt,
        requestedModel: _selectedModel,
      );
      setState(() {
        _result = res;
        _itemsList = List.from(res.detectedItems);
        _activeTab = 0;
      });
    } catch (e) {
      setState(() {
        _result = VisionApiResponse(
          ok: false,
          errorMessage: e.toString(),
        );
      });
    } finally {
      _stopTimer();
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 860, maxHeight: 780),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              VisionDialogHeader(
                onClose: () => Navigator.of(context).pop(),
              ),
              const SizedBox(height: 14),

              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Model Selection
                      VisionModelSelector(
                        selectedModel: _selectedModel,
                        onSelectModel: (m) => setState(() => _selectedModel = m),
                      ),
                      const SizedBox(height: 12),

                      // Image Upload Area
                      VisionUploadArea(
                        imageRawBytes: _imageRawBytes,
                        imageName: _imageName,
                        onPickImage: _pickImage,
                        onClearImage: () => setState(() {
                          _imageRawBytes = null;
                          _imageBytesBase64 = null;
                          _imageName = '';
                          _result = null;
                        }),
                      ),

                      if (_imageRawBytes != null) ...[
                        const SizedBox(height: 10),
                        VisionPromptSelector(
                          selectedPromptId: _selectedPromptId,
                          onSelectPromptId: (p) => setState(() => _selectedPromptId = p),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton.icon(
                          onPressed: _loading ? null : _handleAnalyze,
                          icon: _loading
                              ? const SizedBox(
                                  width: 14,
                                  height: 14,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.auto_awesome, size: 16),
                          label: Text(
                            _loading
                                ? 'Reading Receipt & Extracting Products (${_elapsedSeconds}s)...'
                                : 'Analyze & Extract Items',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],

                      // Results Area
                      if (_result != null) ...[
                        const SizedBox(height: 16),
                        VisionResultsPanel(
                          result: _result!,
                          itemsList: _itemsList,
                          activeTab: _activeTab,
                          onTabChanged: (t) => setState(() => _activeTab = t),
                          state: widget.state,
                          onImportDone: () {
                            if (mounted) Navigator.of(context).pop();
                          },
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
