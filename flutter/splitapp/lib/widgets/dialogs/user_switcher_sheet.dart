import 'package:flutter/material.dart';
import '../../core/calculations.dart';
import '../../state/bill_state.dart';
import '../../theme/app_theme.dart';
import 'user_switcher_components.dart';

export 'user_switcher_components.dart';

/// Modal bottom sheet for switching active user perspective ("Multi-Login")
/// and highlighting individual shares across the app.
class UserSwitcherSheet extends StatefulWidget {
  final BillState state;

  const UserSwitcherSheet({super.key, required this.state});

  static Future<void> show(BuildContext context, BillState state) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => UserSwitcherSheet(state: state),
    );
  }

  @override
  State<UserSwitcherSheet> createState() => _UserSwitcherSheetState();
}

class _UserSwitcherSheetState extends State<UserSwitcherSheet> {
  final TextEditingController _nameController = TextEditingController();
  bool _showAddForm = false;
  String? _errorText;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _handleAddAndSwitch() {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _errorText = 'Please enter a name');
      return;
    }

    final isDuplicate = widget.state.bill.people.any(
      (p) => normalizeName(p.name) == normalizeName(name),
    );
    if (isDuplicate) {
      setState(() => _errorText = '“$name” is already in this bill');
      return;
    }

    widget.state.addPerson(name, switchTo: true);
    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content:
            Text('Switched profile to $name. Your part is now highlighted!'),
        backgroundColor: AppColors.mintSage,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bill = widget.state.bill;
    final preview = widget.state.preview;
    final currency = bill.currency;
    final active = widget.state.activePerson;
    final people = bill.people;

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.25),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.electricIris.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.switch_account_rounded,
                        color: AppColors.electricIris,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'MULTI-LOGIN & SWITCH USER',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 0.8,
                            ),
                          ),
                          Text(
                            'Select who you are to highlight your personal share',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.65),
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close_rounded, color: Colors.white70),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // People list
          ConstrainedBox(
            constraints: const BoxConstraints(maxHeight: 340),
            child: people.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        'No participants in this bill yet. Add one below!',
                        style: TextStyle(
                            color: AppColors.textSecondary, fontSize: 13),
                      ),
                    ),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    itemCount: people.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final person = people[index];
                      final isSelected = active?.id == person.id;
                      final pRes = preview.people[person.id];
                      final share = pRes?.share ?? 0;
                      final paid = person.paidAmount;
                      final net = pRes?.net ?? (paid - share);

                      return UserSwitcherProfileCard(
                        person: person,
                        isSelected: isSelected,
                        share: share,
                        paid: paid,
                        net: net,
                        currency: currency,
                        onTap: () {
                          widget.state.setActivePerson(person.id);
                          Navigator.of(context).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(
                                  'Switched profile to ${person.name}. Highlighting your data!'),
                              backgroundColor: AppColors.electricIris,
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        },
                      );
                    },
                  ),
          ),

          const SizedBox(height: 16),

          // Add New Profile Section
          if (!_showAddForm) ...[
            OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: AppColors.border),
                padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: () => setState(() => _showAddForm = true),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.person_add_rounded, size: 18),
                  SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      'Add Person Profile & Switch',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            UserSwitcherAddForm(
              controller: _nameController,
              errorText: _errorText,
              onCancel: () => setState(() {
                _showAddForm = false;
                _errorText = null;
              }),
              onSubmit: _handleAddAndSwitch,
            ),
          ],
        ],
      ),
    );
  }
}
