import 'package:flutter/material.dart';
import '../../core/calculations.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';
import '../common/app_badge.dart';
import '../common/person_avatar.dart';
import '../common/smart_inputs.dart';

class PeopleListTile extends StatefulWidget {
  final Person person;
  final BillState state;
  final VoidCallback onRemove;

  const PeopleListTile({
    super.key,
    required this.person,
    required this.state,
    required this.onRemove,
  });

  @override
  State<PeopleListTile> createState() => _PeopleListTileState();
}

class _PeopleListTileState extends State<PeopleListTile> {
  bool _isEditingName = false;
  bool _isEditingPhoto = false;
  String _photoEditInput = '';

  @override
  Widget build(BuildContext context) {
    final person = widget.person;
    final bill = widget.state.bill;
    final isPayer = person.paidAmount > 0;
    final assignedCount = bill.items
        .where((item) => assignedIdsOf(item).contains(person.id))
        .length;
    final isActive = widget.state.activePerson?.id == person.id;
    final personResult = widget.state.preview.people[person.id];
    final share = personResult?.share;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isActive
            ? AppColors.electricIris.withValues(alpha: 0.12)
            : AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive ? AppColors.electricIris : AppColors.border,
          width: isActive ? 1.8 : 1.0,
        ),
        boxShadow: isActive
            ? [
                BoxShadow(
                  color: AppColors.electricIris.withValues(alpha: 0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ]
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              PersonAvatar(
                name: person.name,
                photo: person.photo,
                size: AvatarSize.md,
                isPayer: isPayer,
                showBadge: isActive,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _isEditingName
                    ? TextField(
                        autofocus: true,
                        controller: TextEditingController(text: person.name)
                          ..selection = TextSelection.collapsed(
                              offset: person.name.length),
                        style: const TextStyle(
                            fontSize: 13, color: AppColors.textPrimary),
                        decoration: const InputDecoration(isDense: true),
                        onSubmitted: (val) {
                          widget.state.renamePerson(person.id, val);
                          setState(() => _isEditingName = false);
                        },
                      )
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 6,
                            runSpacing: 4,
                            children: [
                              Text(
                                person.name,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              if (isActive)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.electricIris,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Text(
                                    'YOU',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w900,
                                    ),
                                  ),
                                )
                              else
                                InkWell(
                                  onTap: () {
                                    widget.state.setActivePerson(person.id);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                            'Switched profile to ${person.name}. Highlighting their share!'),
                                        backgroundColor:
                                            AppColors.electricIris,
                                        duration: const Duration(seconds: 2),
                                      ),
                                    );
                                  },
                                  borderRadius: BorderRadius.circular(8),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 5, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.surface,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                          color: AppColors.borderSubtle),
                                    ),
                                    child: const FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.swap_horiz_rounded,
                                              size: 11,
                                              color: AppColors.electricIris),
                                          SizedBox(width: 2),
                                          Text(
                                            'Switch',
                                            style: TextStyle(
                                              color: AppColors.electricIris,
                                              fontSize: 9,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            assignedCount == 0
                                ? 'Not assigned to any product yet'
                                : 'Sharing $assignedCount ${assignedCount == 1 ? 'product' : 'products'}${share != null ? ' · share ${formatMoney(share, bill.currency)}' : ''}',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
              ),
              if (!_isEditingName) ...[
                IconButton(
                  icon: const Icon(Icons.image_outlined, size: 14),
                  color: AppColors.textMuted,
                  tooltip: 'Change photo URL',
                  onPressed: () {
                    setState(() {
                      _isEditingPhoto = !_isEditingPhoto;
                      _photoEditInput = person.photo ?? '';
                    });
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.edit_outlined, size: 14),
                  color: AppColors.textMuted,
                  tooltip: 'Rename',
                  onPressed: () => setState(() => _isEditingName = true),
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded, size: 14),
                  color: AppColors.textMuted,
                  hoverColor: AppColors.dangerSubtle,
                  tooltip: 'Remove',
                  onPressed: widget.onRemove,
                ),
              ],
            ],
          ),

          // Inline Photo Edit Row
          if (_isEditingPhoto) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: TextEditingController(text: _photoEditInput)
                      ..selection = TextSelection.collapsed(
                          offset: _photoEditInput.length),
                    style: const TextStyle(
                        fontSize: 11, color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                      hintText: 'Paste image photo URL...',
                      isDense: true,
                    ),
                    onChanged: (v) => _photoEditInput = v,
                  ),
                ),
                const SizedBox(width: 4),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 4),
                  ),
                  onPressed: () {
                    widget.state.setPersonPhoto(person.id, _photoEditInput);
                    setState(() => _isEditingPhoto = false);
                  },
                  child: const Text('Save', style: TextStyle(fontSize: 11)),
                ),
                const SizedBox(width: 4),
                TextButton(
                  onPressed: () => setState(() => _isEditingPhoto = false),
                  child: const Text('Cancel', style: TextStyle(fontSize: 11)),
                ),
              ],
            ),
          ],

          const SizedBox(height: 8),
          // Paid Amount Row
          Wrap(
            spacing: 6,
            runSpacing: 4,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              MoneyInputField(
                width: 90,
                value: person.paidAmount,
                onCommit: (val) => widget.state.setPaidAmount(person.id, val),
              ),
              OutlinedButton.icon(
                onPressed: () => widget.state.payRemaining(person.id),
                icon: const Icon(Icons.check, size: 12),
                label: const Text('Paid all', style: TextStyle(fontSize: 11)),
                style: OutlinedButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                ),
              ),
              if (isPayer)
                const AppBadge(
                  variant: BadgeVariant.success,
                  label: 'Payer',
                ),
            ],
          ),
        ],
      ),
    );
  }
}
