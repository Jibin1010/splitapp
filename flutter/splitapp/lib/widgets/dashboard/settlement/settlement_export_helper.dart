import 'dart:convert';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../core/export_service.dart';
import '../../../state/bill_state.dart';
import '../../../theme/app_theme.dart';

Future<void> exportSettlementCsv(BuildContext context, BillState state) async {
  final result = state.result ?? state.preview;
  final csv = buildCsv(state.bill, result);
  final rawName = state.bill.name.isEmpty ? 'shared-bill' : state.bill.name;
  final cleanName = rawName
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-+|-+$'), '');
  final fileName = '$cleanName-split.csv';

  try {
    final outputFile = await FilePicker.platform.saveFile(
      dialogTitle: 'Save SplitLedger CSV',
      fileName: fileName,
      type: FileType.custom,
      allowedExtensions: ['csv'],
      bytes: Uint8List.fromList(utf8.encode('\uFEFF$csv')),
    );

    if (context.mounted) {
      if (outputFile != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Saved CSV to $fileName'),
            backgroundColor: AppColors.success,
          ),
        );
      } else {
        await Clipboard.setData(ClipboardData(text: csv));
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('CSV content copied to clipboard!'),
              backgroundColor: AppColors.electricIris,
            ),
          );
        }
      }
    }
  } catch (_) {
    await Clipboard.setData(ClipboardData(text: csv));
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('CSV content copied to clipboard!'),
          backgroundColor: AppColors.electricIris,
        ),
      );
    }
  }
}
