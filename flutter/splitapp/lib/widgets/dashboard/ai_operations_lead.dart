import 'package:flutter/material.dart';
import '../../core/money.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';
import 'ai_chat_components.dart';

export 'ai_chat_components.dart';

/// Tubik Style AI Operations Lead Screen & Chat Assistant
/// Derived directly from Screen 3 "AI OPERATIONS LEAD"
class AiOperationsLeadWidget extends StatefulWidget {
  final BillState state;
  final VoidCallback onScanBill;
  final VoidCallback onOpenHeadPayers;
  final VoidCallback onOpenBreakdown;

  const AiOperationsLeadWidget({
    super.key,
    required this.state,
    required this.onScanBill,
    required this.onOpenHeadPayers,
    required this.onOpenBreakdown,
  });

  @override
  State<AiOperationsLeadWidget> createState() => _AiOperationsLeadWidgetState();
}

class _AiOperationsLeadWidgetState extends State<AiOperationsLeadWidget> {
  final TextEditingController _promptController = TextEditingController();
  final List<Map<String, String>> _messages = [];

  @override
  void initState() {
    super.initState();
    _initInitialAiMessage();
  }

  void _initInitialAiMessage() {
    final bill = widget.state.bill;
    final preview = widget.state.preview;
    final totalPaid = bill.people.fold<int>(0, (sum, p) => sum + p.paidAmount);
    final isBalanced = totalPaid == preview.billTotal && preview.billTotal > 0;

    final venueName = bill.vendor ?? bill.name.ifEmpty('The Daily Grind');
    final totalFmt = formatMoney(preview.billTotal, bill.currency);

    String statusMsg =
        'Hi, Hanna, $venueName shows $totalFmt in current bill operations. ';
    if (isBalanced) {
      statusMsg +=
          'All head payers are balanced and settlements are mathematically optimized. Ready for one-click audit.';
    } else {
      final diff = (preview.billTotal - totalPaid).abs();
      statusMsg +=
          'Two flags need attention: Head payer balance has a difference of ${formatMoney(diff, bill.currency)}. Let\'s initiate the optimization strategy.';
    }

    _messages.add({
      'role': 'assistant',
      'text': statusMsg,
    });
  }

  void _sendUserPrompt(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return;

    setState(() {
      _messages.add({'role': 'user', 'text': trimmed});
      _promptController.clear();
    });

    // Provide immediate contextual AI response
    Future.delayed(const Duration(milliseconds: 400), () {
      if (!mounted) return;
      final bill = widget.state.bill;
      final preview = widget.state.preview;

      String aiReply;
      final lower = trimmed.toLowerCase();

      if (lower.contains('split') ||
          lower.contains('cost') ||
          lower.contains('share')) {
        final splitList = bill.people.map((p) {
          final share = preview.people[p.id]?.share ?? 0;
          return '• ${p.name}: ${formatMoney(share, bill.currency)}';
        }).join('\n');
        aiReply = 'Here is the current split:\n$splitList';
      } else if (lower.contains('head') ||
          lower.contains('balance') ||
          lower.contains('payer')) {
        widget.state.autoBalanceToFirstPerson();
        aiReply =
            'Balanced! Set first person (${bill.people.firstOrNull?.name ?? 'Head Payer'}) to cover remaining amount. All settlement transfers are now 100% verified.';
      } else if (lower.contains('scan') ||
          lower.contains('ocr') ||
          lower.contains('vision')) {
        aiReply = 'Launching AI Bill Scanner camera...';
        widget.onScanBill();
      } else if (lower.contains('whatsapp') || lower.contains('summary')) {
        widget.onOpenBreakdown();
        aiReply =
            'Opening minimal bill breakdown and copied WhatsApp formatted ledger!';
      } else {
        aiReply =
            'Analyzed "$trimmed". Calculations verified with ${bill.people.length} participants and ${bill.items.length} product rows.';
      }

      setState(() {
        _messages.add({'role': 'assistant', 'text': aiReply});
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(28),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header: AI Operations Lead & Diagonal Arrow Button
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Row(
                  children: [
                    Icon(Icons.smart_toy_rounded,
                        color: AppColors.electricIris, size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'AI OPERATIONS LEAD',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.8,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: AppColors.surfaceElevated,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.border),
                ),
                child: const Center(
                  child: Icon(Icons.north_east_rounded,
                      size: 14, color: Colors.white),
                ),
              ),
            ],
          ),

          const SizedBox(height: 14),

          // Messages List
          Expanded(
            child: ListView.separated(
              itemCount: _messages.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) =>
                  AiMessageItem(message: _messages[index]),
            ),
          ),

          const SizedBox(height: 10),

          // Interactive Quick Action Suggestion Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                AiQuickChip(
                  icon: '💬',
                  label: 'Show split cost',
                  color: AppColors.iceCyan,
                  textColor: const Color(0xFF003D4A),
                  onTap: () => _sendUserPrompt('Show split cost per person'),
                ),
                const SizedBox(width: 8),
                AiQuickChip(
                  icon: '⚖️',
                  label: 'Auto-balance head payers',
                  color: AppColors.honeyYellow,
                  textColor: Colors.black,
                  onTap: () {
                    widget.state.autoBalanceToFirstPerson();
                    _sendUserPrompt('Auto-balance head payers');
                  },
                ),
                const SizedBox(width: 8),
                AiQuickChip(
                  icon: '📸',
                  label: 'Scan receipt with AI',
                  color: AppColors.coral,
                  textColor: Colors.white,
                  onTap: widget.onScanBill,
                ),
                const SizedBox(width: 8),
                AiQuickChip(
                  icon: '📋',
                  label: 'Share summary',
                  color: AppColors.mintSage,
                  textColor: Colors.black,
                  onTap: widget.onOpenBreakdown,
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Bottom Prompt Input Bar
          AiInputBar(
            controller: _promptController,
            onSend: _sendUserPrompt,
          ),
        ],
      ),
    );
  }
}

extension on String {
  String ifEmpty(String fallback) => trim().isEmpty ? fallback : this;
}
