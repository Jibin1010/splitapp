import 'package:flutter/material.dart';
import '../../../core/calculations.dart';
import '../../../models/split_types.dart';
import '../../common/app_badge.dart';
import '../../common/person_avatar.dart';

class ProductAssignedBadge extends StatelessWidget {
  final ProductItem item;
  final Bill bill;
  final VoidCallback onTap;

  const ProductAssignedBadge({
    super.key,
    required this.item,
    required this.bill,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final assigned = assignedIdsOf(item)
        .map((id) => bill.people.firstWhere(
              (p) => p.id == id,
              orElse: () => Person(id: id, name: id),
            ))
        .toList();

    final isEveryone = assigned.length > 2 &&
        bill.people.length > 2 &&
        assigned.length == bill.people.length;

    Widget content;
    if (assigned.isEmpty) {
      content = const AppBadge(
        variant: BadgeVariant.danger,
        icon: Icon(Icons.warning_amber_rounded, size: 12),
        label: 'Unassigned',
      );
    } else if (isEveryone) {
      content = Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildAvatarStack(assigned),
          const SizedBox(width: 6),
          AppBadge(label: 'Everyone (${assigned.length})'),
        ],
      );
    } else {
      content = Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildAvatarStack(assigned),
          const SizedBox(width: 6),
          if (assigned.length == 1)
            AppBadge(label: assigned[0].name)
          else ...[
            AppBadge(label: assigned[0].name),
            const SizedBox(width: 4),
            AppBadge(
              variant: BadgeVariant.secondary,
              label: '+${assigned.length - 1}',
            ),
          ],
        ],
      );
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: content,
        ),
      ),
    );
  }

  Widget _buildAvatarStack(List<Person> people) {
    final display = people.take(3).toList();
    return SizedBox(
      width: 18.0 + (display.length - 1) * 12.0,
      height: 22,
      child: Stack(
        children: [
          for (int i = 0; i < display.length; i++)
            Positioned(
              left: i * 12.0,
              child: PersonAvatar(
                name: display[i].name,
                photo: display[i].photo,
                size: AvatarSize.xs,
              ),
            ),
        ],
      ),
    );
  }
}
