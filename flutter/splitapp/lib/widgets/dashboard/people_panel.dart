import 'package:flutter/material.dart';
import '../../core/calculations.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';
import '../common/app_badge.dart';
import 'people_add_form.dart';
import 'people_list_tile.dart';
import 'people_payment_status_box.dart';
import 'people_remove_dialog.dart';

export 'people_add_form.dart';
export 'people_list_tile.dart';
export 'people_payment_status_box.dart';
export 'people_remove_dialog.dart';

class PeoplePanel extends StatefulWidget {
  final BillState state;

  const PeoplePanel({super.key, required this.state});

  @override
  State<PeoplePanel> createState() => _PeoplePanelState();
}

class _PeoplePanelState extends State<PeoplePanel> {
  String _search = '';
  String _newName = '';
  String _newPhoto = '';
  bool _showPhotoInput = false;
  String? _duplicateWarning;

  void _handleAddPerson() {
    final trimmed = _newName.trim();
    if (trimmed.isEmpty) return;

    final isDuplicate = widget.state.bill.people.any(
      (p) => normalizeName(p.name) == normalizeName(trimmed),
    );
    if (isDuplicate) {
      setState(() {
        _duplicateWarning =
            '“$trimmed” is already in this bill. Names are unique — spacing and capitalisation don’t matter.';
      });
      return;
    }

    widget.state.addPerson(
      trimmed,
      photo: _newPhoto.trim().isNotEmpty ? _newPhoto.trim() : null,
    );
    setState(() {
      _newName = '';
      _newPhoto = '';
      _showPhotoInput = false;
      _duplicateWarning = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final bill = widget.state.bill;
    final totals = billTotalsOf(bill);
    final paidTotal = bill.people.fold<int>(0, (s, p) => s + p.paidAmount);
    final paidMatches = paidTotal == totals.billTotal;

    final filteredPeople = bill.people.where((p) {
      if (_search.trim().isEmpty) return true;
      return p.name.toLowerCase().contains(_search.trim().toLowerCase());
    }).toList();

    return Material(
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.border),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          initiallyExpanded: true,
          tilePadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: const Icon(Icons.people_alt_rounded,
              size: 18, color: AppColors.primaryLight),
          title: Row(
            children: [
              const Text(
                'People',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              if (bill.people.isNotEmpty) ...[
                const SizedBox(width: 8),
                AppBadge(
                  variant: BadgeVariant.secondary,
                  label: bill.people.length.toString(),
                ),
              ],
            ],
          ),
          children: [
            Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Action buttons bar
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    alignment: WrapAlignment.spaceBetween,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const Text(
                        'Participants with photos and payments.',
                        style: TextStyle(
                            fontSize: 11, color: AppColors.textMuted),
                      ),
                      Wrap(
                        spacing: 6,
                        children: [
                          OutlinedButton.icon(
                            onPressed: widget.state.load50DummyPeople,
                            icon: const Icon(Icons.auto_awesome,
                                size: 12, color: AppColors.primaryLight),
                            label: const Text('Load 50 People',
                                style: TextStyle(fontSize: 11)),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              side: BorderSide(
                                  color: AppColors.primary
                                      .withValues(alpha: 0.3)),
                            ),
                          ),
                          if (bill.items.isNotEmpty ||
                              bill.adjustments.isNotEmpty)
                            TextButton(
                              onPressed:
                                  widget.state.clearItemsAndAdjustments,
                              style: TextButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                foregroundColor: AppColors.danger,
                              ),
                              child: const Text('Clear items',
                                  style: TextStyle(fontSize: 11)),
                            ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Add Person Form
                  PeopleAddForm(
                    newName: _newName,
                    newPhoto: _newPhoto,
                    showPhotoInput: _showPhotoInput,
                    duplicateWarning: _duplicateWarning,
                    onNameChanged: (val) {
                      _newName = val;
                      if (_duplicateWarning != null) {
                        setState(() => _duplicateWarning = null);
                      }
                    },
                    onPhotoChanged: (val) => _newPhoto = val,
                    onTogglePhotoInput: () => setState(
                        () => _showPhotoInput = !_showPhotoInput),
                    onAddPerson: _handleAddPerson,
                  ),
                  const SizedBox(height: 12),

                  // Search Bar if > 5 people
                  if (bill.people.length > 5) ...[
                    SizedBox(
                      height: 36,
                      child: TextField(
                        onChanged: (v) => setState(() => _search = v),
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textPrimary),
                        decoration: InputDecoration(
                          prefixIcon: const Icon(Icons.search,
                              size: 16, color: AppColors.textMuted),
                          suffixIcon: _search.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.close, size: 14),
                                  onPressed: () =>
                                      setState(() => _search = ''),
                                )
                              : null,
                          hintText:
                              'Search ${bill.people.length} people...',
                          contentPadding:
                              const EdgeInsets.symmetric(vertical: 4),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],

                  if (_search.trim().isNotEmpty) ...[
                    Text(
                      'Showing ${filteredPeople.length} of ${bill.people.length} people',
                      style: const TextStyle(
                          fontSize: 10, color: AppColors.textMuted),
                    ),
                    const SizedBox(height: 6),
                  ],

                  // People List
                  if (bill.people.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceElevated
                            .withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.border),
                      ),
                      alignment: Alignment.center,
                      child: Column(
                        children: [
                          const Text(
                            'No people yet.',
                            style: TextStyle(
                                fontSize: 13, color: AppColors.textMuted),
                          ),
                          const SizedBox(height: 8),
                          OutlinedButton.icon(
                            onPressed: widget.state.load50DummyPeople,
                            icon: const Icon(Icons.auto_awesome, size: 12),
                            label: const Text(
                                'Load 50 dummy people with photos',
                                style: TextStyle(fontSize: 11)),
                          ),
                        ],
                      ),
                    )
                  else
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 460),
                      child: ListView.separated(
                        shrinkWrap: true,
                        itemCount: filteredPeople.length,
                        separatorBuilder: (ctx, i) =>
                            const SizedBox(height: 8),
                        itemBuilder: (ctx, index) {
                          final person = filteredPeople[index];
                          return PeopleListTile(
                            person: person,
                            state: widget.state,
                            onRemove: () =>
                                showConfirmRemovePersonDialog(
                              context,
                              person: person,
                              state: widget.state,
                            ),
                          );
                        },
                      ),
                    ),
                  const SizedBox(height: 12),

                  // Paid vs Total Status Box
                  if (bill.people.isNotEmpty)
                    PeoplePaymentStatusBox(
                      paidMatches: paidMatches,
                      paidTotal: paidTotal,
                      billTotal: totals.billTotal,
                      currency: bill.currency,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
