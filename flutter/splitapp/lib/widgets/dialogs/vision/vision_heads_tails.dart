import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import '../../common/person_avatar.dart';
import 'vision_dialog_models.dart';

class VisionHeadsTails extends StatelessWidget {
  final List<DialogPerson> people;
  final List<String> headPersonIds;
  final ValueChanged<List<String>> onChangedHeadPersonIds;
  final Map<String, double> headPaidAmounts;
  final ValueChanged<Map<String, double>> onChangedHeadPaidAmounts;
  final Map<String, String> tailHeadPreferences;
  final ValueChanged<Map<String, String>> onChangedTailHeadPreferences;
  final double totalBillRupees;

  const VisionHeadsTails({
    super.key,
    required this.people,
    required this.headPersonIds,
    required this.onChangedHeadPersonIds,
    required this.headPaidAmounts,
    required this.onChangedHeadPaidAmounts,
    required this.tailHeadPreferences,
    required this.onChangedTailHeadPreferences,
    required this.totalBillRupees,
  });

  void _toggleHead(String personId) {
    final list = List<String>.from(headPersonIds);
    if (list.contains(personId)) {
      if (list.length > 1) {
        list.remove(personId);
      }
    } else {
      if (list.length < 4) {
        list.add(personId);
      }
    }
    onChangedHeadPersonIds(list);
  }

  void _autoBalance() {
    if (headPersonIds.isEmpty) return;
    final map = <String, double>{};
    if (headPersonIds.length == 1) {
      map[headPersonIds.first] = totalBillRupees;
    } else {
      final each = double.parse((totalBillRupees / headPersonIds.length).toStringAsFixed(2));
      double sum = 0.0;
      for (int i = 0; i < headPersonIds.length; i++) {
        final hid = headPersonIds[i];
        if (i == headPersonIds.length - 1) {
          map[hid] = double.parse((totalBillRupees - sum).toStringAsFixed(2));
        } else {
          map[hid] = each;
          sum += each;
        }
      }
    }
    onChangedHeadPaidAmounts(map);
  }

  @override
  Widget build(BuildContext context) {
    if (people.isEmpty) return const SizedBox.shrink();

    final totalPaidByHeads = headPersonIds.fold<double>(
      0.0,
      (acc, hid) => acc + (headPaidAmounts[hid] ?? 0.0),
    );
    final diff = totalPaidByHeads - totalBillRupees;
    final isBalanced = diff.abs() < 0.05;
    final tails = people.where((p) => !headPersonIds.contains(p.id)).toList();

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
                      color: AppColors.electricIris.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    alignment: Alignment.center,
                    child: const Text('4', style: TextStyle(color: AppColors.electricIris, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 8),
                  const Text('Heads & Tails Setup', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                ],
              ),
              OutlinedButton.icon(
                onPressed: _autoBalance,
                icon: const Icon(Icons.auto_fix_high_rounded, size: 12),
                label: const Text('Auto-balance', style: TextStyle(fontSize: 11)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.electricIris,
                  side: const BorderSide(color: AppColors.electricIris),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 8,
              runSpacing: 4,
              children: [
                Text('Total: ₹${totalBillRupees.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                Text('Heads: ₹${totalPaidByHeads.toStringAsFixed(2)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white, fontFamily: 'monospace')),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(isBalanced ? Icons.check_circle_rounded : Icons.info_outline_rounded, size: 12, color: isBalanced ? AppColors.mintSage : AppColors.honeyAmber),
                    const SizedBox(width: 4),
                    Text(isBalanced ? 'Balanced' : 'Diff: ₹${diff.toStringAsFixed(2)}', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isBalanced ? AppColors.mintSage : AppColors.honeyAmber)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Heads Selection Chips
          const Text('Select Head Payers (up to 4)', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
          const SizedBox(height: 6),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: people.map((p) {
              final isHead = headPersonIds.contains(p.id);
              return FilterChip(
                selected: isHead,
                avatar: PersonAvatar(name: p.name, photo: p.photo, size: AvatarSize.xs),
                label: Text(p.name, style: TextStyle(fontSize: 11, fontWeight: isHead ? FontWeight.bold : FontWeight.normal)),
                selectedColor: AppColors.honeyAmber,
                labelStyle: TextStyle(color: isHead ? Colors.black : Colors.white),
                onSelected: (_) => _toggleHead(p.id),
              );
            }).toList(),
          ),
          const SizedBox(height: 10),

          // Paid amounts for heads
          const Text('Amount Paid by Each Head', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
          const SizedBox(height: 6),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: headPersonIds.length,
            separatorBuilder: (_, _) => const SizedBox(height: 6),
            itemBuilder: (context, idx) {
              final hid = headPersonIds[idx];
              final person = people.firstWhere((p) => p.id == hid, orElse: () => DialogPerson(id: hid, name: 'Head'));
              final amt = headPaidAmounts[hid] ?? 0.0;

              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    PersonAvatar(name: person.name, photo: person.photo, size: AvatarSize.xs),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text('👑 ${person.name}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.honeyAmber)),
                    ),
                    SizedBox(
                      width: 90,
                      child: TextFormField(
                        key: ValueKey('${hid}_$amt'),
                        initialValue: amt > 0 ? amt.toStringAsFixed(2) : '',
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        textAlign: TextAlign.right,
                        style: const TextStyle(fontSize: 12, color: Colors.white, fontFamily: 'monospace'),
                        decoration: const InputDecoration(
                          prefixText: '₹ ',
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (val) {
                          final pVal = double.tryParse(val) ?? 0.0;
                          final map = Map<String, double>.from(headPaidAmounts);
                          map[hid] = pVal;
                          onChangedHeadPaidAmounts(map);
                        },
                      ),
                    ),
                  ],
                ),
              );
            },
          ),

          if (tails.isNotEmpty) ...[
            const SizedBox(height: 10),
            const Text('Connect Tails to Heads (Who pays whom)', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
            const SizedBox(height: 6),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: tails.length,
              separatorBuilder: (_, _) => const SizedBox(height: 6),
              itemBuilder: (context, idx) {
                final tail = tails[idx];
                final currentHeadId = tailHeadPreferences[tail.id] ?? headPersonIds.first;

                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      PersonAvatar(name: tail.name, photo: tail.photo, size: AvatarSize.xs),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(tail.name, style: const TextStyle(fontSize: 12, color: Colors.white)),
                      ),
                      const Text('pays → ', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                      DropdownButton<String>(
                        value: currentHeadId,
                        isDense: true,
                        underline: const SizedBox.shrink(),
                        dropdownColor: AppColors.surfaceElevated,
                        items: headPersonIds.map((hid) {
                          final h = people.firstWhere((p) => p.id == hid, orElse: () => DialogPerson(id: hid, name: 'Head'));
                          return DropdownMenuItem(
                            value: hid,
                            child: Text('👑 ${h.name}', style: const TextStyle(fontSize: 11, color: AppColors.honeyAmber, fontWeight: FontWeight.bold)),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            final map = Map<String, String>.from(tailHeadPreferences);
                            map[tail.id] = val;
                            onChangedTailHeadPreferences(map);
                          }
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ],
      ),
    );
  }
}
