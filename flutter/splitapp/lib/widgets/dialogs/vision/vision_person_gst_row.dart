import 'package:flutter/material.dart';
import '../../../theme/app_theme.dart';
import '../../common/person_avatar.dart';
import 'vision_dialog_models.dart';

class VisionPersonGstRow extends StatelessWidget {
  final DialogPerson person;
  final double percent;
  final double totalGstRupees;
  final ValueChanged<double> onChangedPercent;

  const VisionPersonGstRow({
    super.key,
    required this.person,
    required this.percent,
    required this.totalGstRupees,
    required this.onChangedPercent,
  });

  @override
  Widget build(BuildContext context) {
    final personRupees = (totalGstRupees * percent) / 100.0;

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
            child: Text(
              person.name,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white),
            ),
          ),
          SizedBox(
            width: 60,
            child: TextFormField(
              key: ValueKey('${person.id}_$percent'),
              initialValue: percent.toStringAsFixed(1),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 12, color: Colors.white, fontFamily: 'monospace'),
              decoration: const InputDecoration(
                suffixText: '%',
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                border: OutlineInputBorder(),
              ),
              onChanged: (val) {
                final pVal = double.tryParse(val) ?? 0.0;
                onChangedPercent(pVal);
              },
            ),
          ),
          const SizedBox(width: 10),
          SizedBox(
            width: 70,
            child: Text(
              '₹${personRupees.toStringAsFixed(2)}',
              textAlign: TextAlign.right,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: AppColors.mintSage,
                fontFamily: 'monospace',
              ),
            ),
          ),
        ],
      ),
    );
  }
}
