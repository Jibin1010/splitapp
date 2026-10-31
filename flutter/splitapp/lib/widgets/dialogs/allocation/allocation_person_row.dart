import 'package:flutter/material.dart';
import '../../../core/money.dart';
import '../../../models/split_types.dart';
import '../../../theme/app_theme.dart';
import '../../common/person_avatar.dart';

class AllocationPersonRow extends StatelessWidget {
  final Person person;
  final bool isChecked;
  final SplitMode mode;
  final CurrencyCode currency;
  final int allocatedPaise;
  final String entryValue;
  final ValueChanged<bool> onToggle;
  final ValueChanged<String> onEntryChanged;

  const AllocationPersonRow({
    super.key,
    required this.person,
    required this.isChecked,
    required this.mode,
    required this.currency,
    required this.allocatedPaise,
    required this.entryValue,
    required this.onToggle,
    required this.onEntryChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      child: Row(
        children: [
          Checkbox(
            value: isChecked,
            activeColor: AppColors.primary,
            onChanged: (on) => onToggle(on == true),
          ),
          PersonAvatar(
            name: person.name,
            photo: person.photo,
            size: AvatarSize.sm,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              person.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          if (mode == SplitMode.equal) ...[
            Text(
              isChecked ? formatMoney(allocatedPaise, currency) : '—',
              style: TextStyle(
                fontSize: 13,
                fontFamily: 'monospace',
                color:
                    isChecked ? AppColors.textPrimary : AppColors.textMuted,
              ),
            ),
          ] else if (isChecked) ...[
            SizedBox(
              width: 90,
              height: 32,
              child: TextField(
                controller: TextEditingController(text: entryValue)
                  ..selection =
                      TextSelection.collapsed(offset: entryValue.length),
                keyboardType:
                    const TextInputType.numberWithOptions(decimal: true),
                textAlign: TextAlign.right,
                style: const TextStyle(
                  fontSize: 12,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
                decoration: InputDecoration(
                  suffixText: mode == SplitMode.quantity
                      ? 'u'
                      : mode == SplitMode.percentage
                          ? '%'
                          : '',
                  isDense: true,
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
                ),
                onChanged: onEntryChanged,
              ),
            ),
          ] else ...[
            const Text(
              'not sharing',
              style: TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
          ],
        ],
      ),
    );
  }
}
