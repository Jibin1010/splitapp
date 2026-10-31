import 'package:flutter/material.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import '../../../theme/app_theme.dart';
import 'vision_dialog_models.dart';
import 'vision_person_gst_row.dart';

export 'vision_person_gst_row.dart';

class VisionGstSection extends StatefulWidget {
  final List<EditableDetectedItem> items;
  final List<DialogPerson> people;
  final bool applyTax;
  final ValueChanged<bool> onToggleTax;
  final double gstRupees;
  final ValueChanged<double> onChangedGstRupees;
  final Map<String, double> personGstShares;
  final ValueChanged<Map<String, double>> onChangedPersonGstShares;

  const VisionGstSection({
    super.key,
    required this.items,
    required this.people,
    required this.applyTax,
    required this.onToggleTax,
    required this.gstRupees,
    required this.onChangedGstRupees,
    required this.personGstShares,
    required this.onChangedPersonGstShares,
  });

  @override
  State<VisionGstSection> createState() => _VisionGstSectionState();
}

class _VisionGstSectionState extends State<VisionGstSection> {
  String _mode = 'proportional'; // 'proportional', 'equal', 'custom'

  void _splitProportional() {
    setState(() => _mode = 'proportional');
    final people = widget.people;
    if (people.isEmpty) return;

    final personTotals = <String, double>{};
    for (final p in people) {
      personTotals[p.id] = 0.0;
    }

    double totalSpend = 0.0;
    for (final item in widget.items) {
      final assigned = item.assignedParticipantIds;
      if (assigned.isNotEmpty) {
        final share = item.totalPaise / assigned.length;
        for (final pid in assigned) {
          if (personTotals.containsKey(pid)) {
            personTotals[pid] = personTotals[pid]! + share;
            totalSpend += share;
          }
        }
      }
    }

    final newShares = <String, double>{};
    double sum = 0.0;
    for (int i = 0; i < people.length; i++) {
      final pid = people[i].id;
      if (i == people.length - 1) {
        newShares[pid] = (100.0 - sum).clamp(0.0, 100.0);
      } else {
        final pct = totalSpend > 0 ? ((personTotals[pid]! / totalSpend) * 100.0) : (100.0 / people.length);
        final rounded = double.parse(pct.toStringAsFixed(1));
        newShares[pid] = rounded;
        sum += rounded;
      }
    }
    widget.onChangedPersonGstShares(newShares);
  }

  void _splitEqual() {
    setState(() => _mode = 'equal');
    final count = widget.people.length;
    if (count == 0) return;
    final equalShare = double.parse((100.0 / count).toStringAsFixed(1));
    final newShares = <String, double>{};
    double sum = 0.0;
    for (int i = 0; i < count; i++) {
      final pid = widget.people[i].id;
      if (i == count - 1) {
        newShares[pid] = (100.0 - sum).clamp(0.0, 100.0);
      } else {
        newShares[pid] = equalShare;
        sum += equalShare;
      }
    }
    widget.onChangedPersonGstShares(newShares);
  }

  @override
  Widget build(BuildContext context) {
    final subtotalPaise = widget.items.fold<int>(0, (acc, i) => acc + i.totalPaise);
    final gstPaise = (widget.gstRupees * 100).round();
    final totalPaise = subtotalPaise + (widget.applyTax ? gstPaise : 0);

    final totalPercent = widget.personGstShares.values.fold<double>(0.0, (acc, val) => acc + val);
    final isBalanced = (totalPercent - 100.0).abs() < 0.2;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: AppColors.mintSage.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    alignment: Alignment.center,
                    child: const Text('3', style: TextStyle(color: AppColors.mintSage, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 8),
                  const Text('GST / Tax Allocation', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                ],
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('Apply GST', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  Switch(
                    value: widget.applyTax,
                    onChanged: widget.onToggleTax,
                    activeThumbColor: AppColors.mintSage,
                  ),
                ],
              ),
            ],
          ),

          if (widget.applyTax) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(child: _metricTile('Items Subtotal', formatMoney(subtotalPaise, CurrencyCode.inr), AppColors.textSecondary)),
                const SizedBox(width: 6),
                Expanded(child: _metricTile('GST Amount', formatMoney(gstPaise, CurrencyCode.inr), AppColors.honeyAmber)),
                const SizedBox(width: 6),
                Expanded(child: _metricTile('Grand Total', formatMoney(totalPaise, CurrencyCode.inr), AppColors.mintSage)),
              ],
            ),
            const SizedBox(height: 12),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                SizedBox(
                  width: 140,
                  child: TextFormField(
                    initialValue: widget.gstRupees.toStringAsFixed(2),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: const TextStyle(fontSize: 12, color: Colors.white, fontFamily: 'monospace'),
                    decoration: const InputDecoration(
                      labelText: 'Total GST (₹)',
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (val) {
                      final parsed = double.tryParse(val) ?? 0.0;
                      widget.onChangedGstRupees(parsed);
                    },
                  ),
                ),
                ChoiceChip(
                  label: const Text('Proportional', style: TextStyle(fontSize: 11)),
                  selected: _mode == 'proportional',
                  onSelected: (_) => _splitProportional(),
                  selectedColor: AppColors.mintSage,
                  labelStyle: TextStyle(color: _mode == 'proportional' ? Colors.black : Colors.white),
                ),
                ChoiceChip(
                  label: const Text('Equal %', style: TextStyle(fontSize: 11)),
                  selected: _mode == 'equal',
                  onSelected: (_) => _splitEqual(),
                  selectedColor: AppColors.mintSage,
                  labelStyle: TextStyle(color: _mode == 'equal' ? Colors.black : Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (widget.people.isEmpty)
              const Text('No participants added yet.', style: TextStyle(fontSize: 12, color: AppColors.textMuted))
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: widget.people.length,
                separatorBuilder: (_, _) => const SizedBox(height: 6),
                itemBuilder: (context, idx) {
                  final person = widget.people[idx];
                  final pct = widget.personGstShares[person.id] ?? 0.0;

                  return VisionPersonGstRow(
                    person: person,
                    percent: pct,
                    totalGstRupees: widget.gstRupees,
                    onChangedPercent: (newPct) {
                      setState(() => _mode = 'custom');
                      final updated = Map<String, double>.from(widget.personGstShares);
                      updated[person.id] = newPct;
                      widget.onChangedPersonGstShares(updated);
                    },
                  );
                },
              ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Icon(
                  isBalanced ? Icons.check_circle_rounded : Icons.info_outline_rounded,
                  size: 14,
                  color: isBalanced ? AppColors.mintSage : AppColors.coralRed,
                ),
                const SizedBox(width: 4),
                Text(
                  '${totalPercent.toStringAsFixed(1)}% · ${isBalanced ? 'Balanced' : 'Unbalanced'}',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isBalanced ? AppColors.mintSage : AppColors.coralRed),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _metricTile(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
          const SizedBox(height: 2),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color, fontFamily: 'monospace')),
          ),
        ],
      ),
    );
  }
}
