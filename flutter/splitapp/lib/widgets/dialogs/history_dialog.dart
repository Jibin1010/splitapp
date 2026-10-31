import 'package:flutter/material.dart';
import '../../core/calculations.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../services/storage_service.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';
import '../common/app_badge.dart';

class HistoryDialog extends StatefulWidget {
  final StorageService storage;
  final BillState state;

  const HistoryDialog({
    super.key,
    required this.storage,
    required this.state,
  });

  @override
  State<HistoryDialog> createState() => _HistoryDialogState();
}

class _HistoryDialogState extends State<HistoryDialog> {
  late List<HistoryEntry> _entries;

  @override
  void initState() {
    super.initState();
    _entries = widget.storage.loadHistory();
  }

  void _handleOpen(HistoryEntry entry) {
    widget.state.loadBill(entry.bill);
    Navigator.of(context).pop();
  }

  void _handleDelete(String id) async {
    final updated = await widget.storage.removeFromHistory(id);
    setState(() {
      _entries = updated;
    });
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 580, maxHeight: 600),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.history_rounded, size: 22, color: AppColors.primary),
                      SizedBox(width: 8),
                      Text(
                        'History',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, size: 20),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'Bills you saved with “Save Draft”. They live only on this device — clearing stored data removes them permanently.',
                style: TextStyle(fontSize: 12, color: AppColors.textMuted),
              ),
              const SizedBox(height: 16),

              // Entries List
              Expanded(
                child: _entries.isEmpty
                    ? Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceElevated.withValues(alpha: 0.5),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'No saved bills yet. Use “Save Draft” in the header to keep a copy of the current bill here.',
                          style: TextStyle(fontSize: 13, color: AppColors.textMuted),
                          textAlign: TextAlign.center,
                        ),
                      )
                    : ListView.separated(
                        itemCount: _entries.length,
                        separatorBuilder: (ctx, i) => const SizedBox(height: 8),
                        itemBuilder: (ctx, index) {
                          final entry = _entries[index];
                          final totals = billTotalsOf(entry.bill);

                          return Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceElevated,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        entry.bill.name.isEmpty ? 'Shared Bill' : entry.bill.name,
                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Saved ${_formatDate(entry.savedAt)} · ${entry.bill.items.length} ${entry.bill.items.length == 1 ? 'item' : 'items'} · ${entry.bill.people.length} ${entry.bill.people.length == 1 ? 'person' : 'people'}',
                                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                      ),
                                      const SizedBox(height: 6),
                                      Row(
                                        children: [
                                          AppBadge(
                                            variant: BadgeVariant.secondary,
                                            label: formatMoney(totals.billTotal, entry.bill.currency),
                                          ),
                                          if (entry.result != null) ...[
                                            const SizedBox(width: 6),
                                            const AppBadge(
                                              variant: BadgeVariant.success,
                                              label: 'Calculated',
                                            ),
                                          ],
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                OutlinedButton.icon(
                                  onPressed: () => _handleOpen(entry),
                                  icon: const Icon(Icons.folder_open_rounded, size: 14),
                                  label: const Text('Open', style: TextStyle(fontSize: 12)),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline_rounded, size: 16),
                                  color: AppColors.textMuted,
                                  hoverColor: AppColors.dangerSubtle,
                                  onPressed: () => _handleDelete(entry.id),
                                  tooltip: 'Delete draft',
                                ),
                              ],
                            ),
                          );
                        },
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
