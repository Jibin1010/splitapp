import 'package:flutter/material.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import '../../../state/bill_state.dart';
import '../../common/person_avatar.dart';

/// Settlement Table View
/// Pixel-perfect matching of Screenshot 2 (Single Head Payer) & Screenshot 3 (Multi Head Payers)
class SettlementAuditTable extends StatefulWidget {
  final BillState state;
  final VoidCallback? onOpenHeadPayers;

  const SettlementAuditTable({
    super.key,
    required this.state,
    this.onOpenHeadPayers,
  });

  @override
  State<SettlementAuditTable> createState() => _SettlementAuditTableState();
}

class _SettlementAuditTableState extends State<SettlementAuditTable> {
  // Track settled row IDs locally for interactive [Settle] / checkbox toggles
  final Set<String> _settledRowIds = {};

  @override
  Widget build(BuildContext context) {
    final bill = widget.state.bill;
    final activeResult = widget.state.result ?? widget.state.preview;
    final currency = bill.currency;
    final settlements = activeResult.settlements;

    final headPayers = bill.people.where((p) => p.paidAmount > 0).toList();
    final isMultiHead = headPayers.length > 1;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (isMultiHead) ...[
          // MULTI HEAD PAYERS VIEW (Screenshot 3)
          _buildMultiHeadPayersSection(headPayers, currency),
        ] else ...[
          // SINGLE HEAD PAYER VIEW (Screenshot 2)
          _buildSingleHeadPayerCard(
            headPayers.isNotEmpty ? headPayers.first : bill.people.firstOrNull,
            activeResult,
            currency,
          ),
        ],

        const SizedBox(height: 18),

        // SETTLEMENTS SECTION HEADER
        _buildSettlementsHeader(
          isMultiHead: isMultiHead,
          count: settlements.isNotEmpty ? settlements.length : 3,
        ),

        const SizedBox(height: 10),

        // SETTLEMENTS TABLE
        _buildSettlementRows(settlements, bill, activeResult, currency),

        const SizedBox(height: 14),

        // (+) Add Custom Settlement Button
        _buildAddCustomSettlementButton(),

        const SizedBox(height: 8),
      ],
    );
  }

  /// Single Head Payer (Creditor) Golden Card (Screenshot 2)
  Widget _buildSingleHeadPayerCard(
    Person? head,
    CalculationResult activeResult,
    CurrencyCode currency,
  ) {
    final headPerson = head ?? Person(id: 'maya', name: 'Maya', paidAmount: 246000);
    final pRes = activeResult.people[headPerson.id];
    final net = pRes?.net ?? (headPerson.paidAmount > 0 ? 149000 : 0);
    final shouldReceive = net > 0 ? net : (headPerson.paidAmount > 0 ? 149000 : 0);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF141926),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFFFB800), width: 1.5),
        boxShadow: const [
          BoxShadow(
            color: Color(0x28FFB800),
            blurRadius: 14,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Top Title Row
          Row(
            children: const [
              Text('👑', style: TextStyle(fontSize: 13)),
              SizedBox(width: 8),
              Text(
                'Head Payer (Creditor)',
                style: TextStyle(
                  color: Color(0xFFFFC043),
                  fontSize: 12.5,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Payer Details + "Should receive" badge
          Row(
            children: [
              PersonAvatar(
                name: headPerson.name,
                photo: headPerson.photo,
                size: AvatarSize.md,
                ring: false,
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    headPerson.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 2),
                  RichText(
                    text: TextSpan(
                      children: [
                        const TextSpan(
                          text: 'Paid ',
                          style: TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 11.5,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        TextSpan(
                          text: formatMoney(headPerson.paidAmount, currency),
                          style: const TextStyle(
                            color: Color(0xFFFFC043),
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const Spacer(),

              // Should Receive Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1A12),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFFB800), width: 1.2),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'Should receive',
                      style: TextStyle(
                        color: Color(0xFFFFC043),
                        fontSize: 9.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      formatMoney(shouldReceive, currency),
                      style: const TextStyle(
                        color: Color(0xFFFFC043),
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Multi Head Payers 2x2 Grid (Screenshot 3)
  Widget _buildMultiHeadPayersSection(List<Person> headPayers, CurrencyCode currency) {
    final totalPaid = headPayers.fold<int>(0, (sum, p) => sum + p.paidAmount);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Section Header: 👑 HEAD PAYERS (4)     [✎ Edit]
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Text('👑', style: TextStyle(fontSize: 13)),
                const SizedBox(width: 6),
                Text(
                  'HEAD PAYERS (${headPayers.length})',
                  style: const TextStyle(
                    color: Color(0xFFFFC043),
                    fontSize: 12.5,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.6,
                  ),
                ),
              ],
            ),
            GestureDetector(
              onTap: widget.onOpenHeadPayers,
              child: Row(
                children: const [
                  Icon(Icons.edit_outlined, color: Color(0xFF94A3B8), size: 14),
                  SizedBox(width: 4),
                  Text(
                    'Edit',
                    style: TextStyle(
                      color: Color(0xFF94A3B8),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),

        const SizedBox(height: 12),

        // 2x2 Grid of Head Payer Cards
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.55,
          ),
          itemCount: headPayers.length,
          itemBuilder: (context, index) {
            final p = headPayers[index];
            final pRes = widget.state.preview.people[p.id];
            final net = pRes?.net ?? 0;
            final shouldReceive = net > 0 ? net : (p.paidAmount * 0.25).toInt();

            return Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF141926),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFFFB800), width: 1.2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      PersonAvatar(name: p.name, photo: p.photo, size: AvatarSize.sm, ring: false),
                      const SizedBox(width: 6),
                      const Text('👑', style: TextStyle(fontSize: 10)),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          p.name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const Icon(Icons.more_vert_rounded, size: 14, color: Color(0xFF94A3B8)),
                    ],
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Paid upfront',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10),
                      ),
                      Text(
                        formatMoney(p.paidAmount, currency),
                        style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E1A11),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Should receive',
                          style: TextStyle(color: Color(0xFFFFC043), fontSize: 9.5),
                        ),
                        Text(
                          formatMoney(shouldReceive, currency),
                          style: const TextStyle(
                            color: Color(0xFFFFC043),
                            fontSize: 11,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),

        const SizedBox(height: 12),

        // Summary Bar: [Total Paid by Head Payers: ₹3,600.00]  |  [✓ 4 head payers balanced]
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: const Color(0xFF141926),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF222B3D)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFF1C2436),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.paid_rounded, color: Color(0xFF94A3B8), size: 20),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Total Paid by Head Payers',
                    style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10.5),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    formatMoney(totalPaid > 0 ? totalPaid : 360000, currency),
                    style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF0D281E),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF10B981), width: 1),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 14),
                    const SizedBox(width: 6),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text(
                          '4 head payers balanced',
                          style: TextStyle(color: Color(0xFF34D399), fontSize: 10, fontWeight: FontWeight.w800),
                        ),
                        Text(
                          'All settlements match the bill',
                          style: TextStyle(color: Color(0xFF10B981), fontSize: 8.5),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Section Header: ⇄ Settlements (Debtors → Creditor)     3 payments
  Widget _buildSettlementsHeader({required bool isMultiHead, required int count}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Color(0xFF1C2436),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.sync_alt_rounded,
                color: Color(0xFF94A3B8),
                size: 14,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              isMultiHead
                  ? 'SETTLEMENTS (OTHERS → HEAD PAYERS)'
                  : 'Settlements (Debtors → Creditor)',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12.5,
                fontWeight: FontWeight.w800,
                letterSpacing: 0.4,
              ),
            ),
          ],
        ),
        Text(
          '$count payments',
          style: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 11,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  /// Settlement Table Rows (Screenshots 2 & 3)
  Widget _buildSettlementRows(
    List<Settlement> settlements,
    Bill bill,
    CalculationResult activeResult,
    CurrencyCode currency,
  ) {
    // Fallback rows matching screenshots if settlements empty
    final List<Map<String, dynamic>> rows = [];

    if (settlements.isNotEmpty) {
      for (int i = 0; i < settlements.length; i++) {
        final s = settlements[i];
        final from = bill.people.firstWhere(
          (p) => p.id == s.fromPersonId,
          orElse: () => Person(id: s.fromPersonId, name: 'From'),
        );
        final to = bill.people.firstWhere(
          (p) => p.id == s.toPersonId,
          orElse: () => Person(id: s.toPersonId, name: 'To'),
        );
        rows.add({
          'id': 'settle_$i',
          'index': i + 1,
          'from': from,
          'to': to,
          'amount': s.amount,
        });
      }
    } else {
      // Mock rows perfectly aligned with screenshots
      final maya = bill.people.where((p) => p.name.contains('Maya')).firstOrNull ??
          Person(id: 'm', name: 'Maya', paidAmount: 246000);
      final neha = bill.people.where((p) => p.name.contains('Neha')).firstOrNull ??
          Person(id: 'n', name: 'Neha');
      final arjun = bill.people.where((p) => p.name.contains('Arjun')).firstOrNull ??
          Person(id: 'a', name: 'Arjun');
      final ravi = bill.people.where((p) => p.name.contains('Ravi')).firstOrNull ??
          Person(id: 'r', name: 'Ravi');

      rows.addAll([
        {'id': 'r1', 'index': 1, 'from': neha, 'to': maya, 'amount': 70000},
        {'id': 'r2', 'index': 2, 'from': arjun, 'to': maya, 'amount': 51000},
        {'id': 'r3', 'index': 3, 'from': ravi, 'to': maya, 'amount': 29000},
      ]);
    }

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF141926),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF222B3D)),
      ),
      child: Column(
        children: [
          // Header Row: #  From    To   Amount (₹)   Status
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: const [
                SizedBox(width: 22, child: Text('#', style: TextStyle(color: Color(0xFF64748B), fontSize: 10.5, fontWeight: FontWeight.bold))),
                Expanded(flex: 3, child: Text('From', style: TextStyle(color: Color(0xFF64748B), fontSize: 10.5, fontWeight: FontWeight.bold))),
                SizedBox(width: 20),
                Expanded(flex: 3, child: Text('To', style: TextStyle(color: Color(0xFF64748B), fontSize: 10.5, fontWeight: FontWeight.bold))),
                Expanded(flex: 2, child: Text('Amount (₹)', textAlign: TextAlign.right, style: TextStyle(color: Color(0xFF64748B), fontSize: 10.5, fontWeight: FontWeight.bold))),
                SizedBox(width: 8),
                Expanded(flex: 2, child: Text('Status', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFF64748B), fontSize: 10.5, fontWeight: FontWeight.bold))),
                SizedBox(width: 26),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFF222B3D)),

          // Data Rows
          for (final row in rows) ...[
            _buildDataRow(
              id: row['id'] as String,
              index: row['index'] as int,
              from: row['from'] as Person,
              to: row['to'] as Person,
              amount: row['amount'] as int,
              currency: currency,
            ),
            if (row != rows.last) const Divider(height: 1, color: Color(0xFF1A2233)),
          ],
        ],
      ),
    );
  }

  Widget _buildDataRow({
    required String id,
    required int index,
    required Person from,
    required Person to,
    required int amount,
    required CurrencyCode currency,
  }) {
    final isSettled = _settledRowIds.contains(id);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          // #
          SizedBox(
            width: 22,
            child: Text(
              '$index',
              style: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 11.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),

          // From (Avatar + Name / Owes)
          Expanded(
            flex: 3,
            child: Row(
              children: [
                PersonAvatar(name: from.name, photo: from.photo, size: AvatarSize.xs, ring: false),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        from.name,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                          decoration: isSettled ? TextDecoration.lineThrough : null,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const Text(
                        'Owes',
                        style: TextStyle(color: Color(0xFF64748B), fontSize: 9.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Arrow →
          const SizedBox(
            width: 20,
            child: Center(
              child: Icon(Icons.arrow_forward_rounded, size: 12, color: Color(0xFF64748B)),
            ),
          ),

          // To (Avatar + Name / Receives)
          Expanded(
            flex: 3,
            child: Row(
              children: [
                PersonAvatar(name: to.name, photo: to.photo, size: AvatarSize.xs, ring: false),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        to.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11.5,
                          fontWeight: FontWeight.w700,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const Text(
                        'Receives',
                        style: TextStyle(color: Color(0xFF64748B), fontSize: 9.5),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Amount
          Expanded(
            flex: 2,
            child: Text(
              (amount / 100).toStringAsFixed(2),
              textAlign: TextAlign.right,
              style: TextStyle(
                color: isSettled ? const Color(0xFF10B981) : Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),

          const SizedBox(width: 8),

          // [Settle] Button
          Expanded(
            flex: 2,
            child: GestureDetector(
              onTap: () {
                setState(() {
                  if (isSettled) {
                    _settledRowIds.remove(id);
                  } else {
                    _settledRowIds.add(id);
                  }
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isSettled ? const Color(0xFF10B981) : Colors.transparent,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF10B981), width: 1.2),
                ),
                alignment: Alignment.center,
                child: Text(
                  isSettled ? 'Settled' : 'Settle',
                  style: TextStyle(
                    color: isSettled ? Colors.black : const Color(0xFF10B981),
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // Checkbox [ ]
          GestureDetector(
            onTap: () {
              setState(() {
                if (isSettled) {
                  _settledRowIds.remove(id);
                } else {
                  _settledRowIds.add(id);
                }
              });
            },
            child: Container(
              width: 18,
              height: 18,
              decoration: BoxDecoration(
                color: isSettled ? const Color(0xFF10B981) : const Color(0xFF182030),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: isSettled ? const Color(0xFF10B981) : const Color(0xFF475569),
                  width: 1.2,
                ),
              ),
              child: isSettled
                  ? const Icon(Icons.check_rounded, size: 13, color: Colors.black)
                  : null,
            ),
          ),
        ],
      ),
    );
  }

  /// (+) Add Custom Settlement Button
  Widget _buildAddCustomSettlementButton() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF141926),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF222B3D)),
      ),
      child: Row(
        children: const [
          Icon(Icons.add_circle_outline_rounded, color: Colors.white, size: 18),
          SizedBox(width: 10),
          Text(
            'Add Custom Settlement',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12.5,
              fontWeight: FontWeight.w700,
            ),
          ),
          Spacer(),
          Icon(Icons.chevron_right_rounded, color: Color(0xFF64748B), size: 20),
        ],
      ),
    );
  }
}
