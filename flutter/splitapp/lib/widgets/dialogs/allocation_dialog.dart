import 'package:flutter/material.dart';
import '../../core/calculations.dart';
import '../../core/money.dart';
import '../../models/split_types.dart';
import '../../theme/app_theme.dart';
import 'allocation/allocation_controller.dart';
import 'allocation/allocation_helpers.dart';
import 'allocation/allocation_person_row.dart';
import 'allocation/allocation_status_box.dart';
import 'allocation/allocation_toolbar.dart';
import 'allocation/split_mode_selector_grid.dart';

export 'allocation/allocation_controller.dart';
export 'allocation/allocation_helpers.dart';
export 'allocation/allocation_person_row.dart';
export 'allocation/allocation_status_box.dart';
export 'allocation/allocation_toolbar.dart';
export 'allocation/split_mode_selector_grid.dart';

class AllocationDialog extends StatefulWidget {
  final ProductItem item;
  final Bill bill;
  final ValueChanged<Allocation> onSave;

  const AllocationDialog({
    super.key,
    required this.item,
    required this.bill,
    required this.onSave,
  });

  @override
  State<AllocationDialog> createState() => _AllocationDialogState();
}

class _AllocationDialogState extends State<AllocationDialog>
    with AllocationControllerMixin {
  @override
  ProductItem get item => widget.item;

  @override
  Bill get bill => widget.bill;

  @override
  void initState() {
    super.initState();
    initAllocationState();
  }

  @override
  Widget build(BuildContext context) {
    final lineTotal = lineTotalOf(widget.item);
    final itemName = widget.item.name.trim().isEmpty
        ? 'Untitled product'
        : widget.item.name.trim();
    final status = computeAllocationStatus(
      mode: mode,
      item: widget.item,
      bill: widget.bill,
      selectedIds: selectedIds,
      entries: entries,
    );
    final preview = computeItemAllocation(
      widget.bill,
      widget.item.copyWith(allocation: draftAllocation),
    );

    final filteredPeople = widget.bill.people.where((p) {
      if (search.trim().isEmpty) return true;
      return p.name.toLowerCase().contains(search.trim().toLowerCase());
    }).toList();

    final canSave =
        !hasInvalidEntry() && (selectedIds.isEmpty || status.ok);

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 580, maxHeight: 680),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        RichText(
                          text: TextSpan(
                            style: Theme.of(context)
                                .textTheme
                                .titleLarge
                                ?.copyWith(fontSize: 18),
                            children: [
                              const TextSpan(text: 'Assign people — '),
                              TextSpan(
                                text: itemName,
                                style: const TextStyle(
                                    color: AppColors.primary),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${widget.item.quantity} × ${formatMoney(widget.item.unitPrice, widget.bill.currency)} = ${formatMoney(lineTotal, widget.bill.currency)} total. Choose who shares this product and how.',
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded,
                        size: 20, color: AppColors.textMuted),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Split Mode Selector Grid
              SplitModeSelectorGrid(
                selectedMode: mode,
                onSelectMode: (m) => setState(() => mode = m),
              ),
              const SizedBox(height: 12),

              // Quick Actions Toolbar
              AllocationToolbar(
                mode: mode,
                hasPeople: widget.bill.people.isNotEmpty,
                hasSelected: selected.isNotEmpty,
                search: search,
                peopleCount: widget.bill.people.length,
                onSelectEveryone: selectEveryone,
                onClear: clearPeople,
                onSplitEvenly: splitEvenly,
                onSearchChanged: (v) => setState(() => search = v),
              ),
              const SizedBox(height: 10),

              // Participants List
              Expanded(
                child: widget.bill.people.isEmpty
                    ? Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'Add people first — use the People panel on the dashboard.',
                          style: TextStyle(
                              fontSize: 13, color: AppColors.textMuted),
                        ),
                      )
                    : Container(
                        decoration: BoxDecoration(
                          color: AppColors.surfaceElevated,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: ListView.separated(
                          itemCount: filteredPeople.length,
                          separatorBuilder: (ctx, i) =>
                              const Divider(height: 1),
                          itemBuilder: (ctx, index) {
                            final person = filteredPeople[index];
                            final isChecked = selected.contains(person.id);

                            return AllocationPersonRow(
                              person: person,
                              isChecked: isChecked,
                              mode: mode,
                              currency: widget.bill.currency,
                              allocatedPaise:
                                  preview.perPerson[person.id] ?? 0,
                              entryValue: entries[person.id] ?? '',
                              onToggle: (on) =>
                                  togglePerson(person.id, on),
                              onEntryChanged: (val) {
                                entries[person.id] = val;
                                setState(() {});
                              },
                            );
                          },
                        ),
                      ),
              ),
              const SizedBox(height: 10),

              // Status Alert Box
              AllocationStatusBox(
                status: status,
                hasSelected: selectedIds.isNotEmpty,
                mode: mode,
                selectedIds: selectedIds,
                bill: widget.bill,
                preview: preview,
              ),
              const SizedBox(height: 14),

              // Footer Actions
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: canSave
                        ? () {
                            widget.onSave(draftAllocation);
                            Navigator.of(context).pop();
                          }
                        : null,
                    child: Text(
                      selectedIds.isEmpty
                          ? 'Save as unassigned'
                          : 'Save assignment',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
