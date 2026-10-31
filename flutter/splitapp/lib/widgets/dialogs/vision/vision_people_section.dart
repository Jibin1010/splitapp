import 'package:flutter/material.dart';
import '../../../core/dummy_people.dart';
import '../../../core/id.dart';
import '../../../models/split_types.dart';
import '../../../theme/app_theme.dart';
import '../../common/person_avatar.dart';
import 'vision_dialog_models.dart';

class VisionPeopleSection extends StatefulWidget {
  final List<DialogPerson> people;
  final ValueChanged<List<DialogPerson>> onChangedPeople;
  final List<Person> currentBillPeople;

  const VisionPeopleSection({
    super.key,
    required this.people,
    required this.onChangedPeople,
    required this.currentBillPeople,
  });

  @override
  State<VisionPeopleSection> createState() => _VisionPeopleSectionState();
}

class _VisionPeopleSectionState extends State<VisionPeopleSection> {
  final TextEditingController _nameController = TextEditingController();
  List<DummyPersonSeed> _suggestions = [];

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  void _onNameChanged(String query) {
    if (query.trim().isEmpty) {
      setState(() => _suggestions = []);
      return;
    }
    final existing = widget.people.map((p) => p.name).toList();
    setState(() => _suggestions = searchPeopleSuggestions(query.trim(), existing).take(6).toList());
  }

  void _addPerson(String name, [String? photo]) {
    final trimmed = name.trim();
    if (trimmed.isEmpty || widget.people.any((p) => p.name.toLowerCase() == trimmed.toLowerCase())) return;

    final newP = DialogPerson(
      id: newId('person'),
      name: trimmed,
      photo: (photo != null && photo.isNotEmpty) ? photo : getRandomAvatarForName(trimmed),
      isNew: true,
    );
    widget.onChangedPeople([...widget.people, newP]);
    _nameController.clear();
    setState(() => _suggestions = []);
  }

  void _importBillPeople() {
    final current = widget.currentBillPeople;
    final existingIds = widget.people.map((p) => p.id).toSet();
    final toAdd = current
        .where((p) => !existingIds.contains(p.id))
        .map((p) => DialogPerson(id: p.id, name: p.name, photo: p.photo))
        .toList();
    widget.onChangedPeople([...widget.people, ...toAdd]);
  }

  void _addSamplePeople() {
    final names = ['Alok', 'Priya', 'Rohan', 'Sneha'];
    widget.onChangedPeople(names.map((n) => DialogPerson(id: newId('person'), name: n, photo: getRandomAvatarForName(n))).toList());
  }

  @override
  Widget build(BuildContext context) {
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
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 8,
            runSpacing: 6,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: AppColors.electricIris.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Center(
                      child: Text(
                        '1',
                        style: TextStyle(
                          color: AppColors.electricIris,
                          fontSize: 11,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Add People (${widget.people.length})',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
              Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  if (widget.currentBillPeople.isNotEmpty)
                    TextButton.icon(
                      onPressed: _importBillPeople,
                      icon: const Icon(Icons.people_outline_rounded, size: 13),
                      label: Text(
                        'Import (${widget.currentBillPeople.length})',
                        style: const TextStyle(fontSize: 10.5),
                      ),
                      style: TextButton.styleFrom(
                        foregroundColor: AppColors.mintSage,
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                  TextButton.icon(
                    onPressed: _addSamplePeople,
                    icon: const Icon(Icons.auto_awesome_rounded, size: 12),
                    label: const Text('Sample (4)', style: TextStyle(fontSize: 10.5)),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.honeyYellow,
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 2),
          const Text(
            'Add everyone sharing this bill before assigning items',
            style: TextStyle(color: AppColors.textMuted, fontSize: 11),
          ),
          const SizedBox(height: 10),

          // Add Person Input Row
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 36,
                  child: TextField(
                    controller: _nameController,
                    onChanged: _onNameChanged,
                    onSubmitted: (val) => _addPerson(val),
                    style: const TextStyle(fontSize: 12, color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Type name (e.g. Alok, Priya)...',
                      hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 11.5),
                      prefixIcon: const Icon(Icons.person_add_alt_1_rounded, size: 15, color: AppColors.textSecondary),
                      contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                      isDense: true,
                      filled: true,
                      fillColor: AppColors.surface,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.border),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () => _addPerson(_nameController.text),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.electricIris,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  minimumSize: const Size(0, 36),
                ),
                child: const Text('Add', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
              ),
            ],
          ),

          // Suggestions list
          if (_suggestions.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: _suggestions.map((s) {
                return InkWell(
                  onTap: () => _addPerson(s.name, s.photo),
                  borderRadius: BorderRadius.circular(14),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.electricIris.withValues(alpha: 0.5)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        PersonAvatar(name: s.name, photo: s.photo, size: AvatarSize.xs),
                        const SizedBox(width: 5),
                        Text(s.name, style: const TextStyle(color: Colors.white, fontSize: 11)),
                        const SizedBox(width: 3),
                        const Icon(Icons.add, size: 11, color: AppColors.electricIris),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ],

          const SizedBox(height: 10),

          // Chips of added people
          if (widget.people.isNotEmpty)
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: widget.people.map((p) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      PersonAvatar(name: p.name, photo: p.photo, size: AvatarSize.xs),
                      const SizedBox(width: 6),
                      Text(
                        p.name,
                        style: const TextStyle(color: Colors.white, fontSize: 11.5, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 4),
                      GestureDetector(
                        onTap: () {
                          final updated = widget.people.where((x) => x.id != p.id).toList();
                          widget.onChangedPeople(updated);
                        },
                        child: const Icon(Icons.close_rounded, size: 14, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                );
              }).toList(),
            )
          else
            const Text(
              'No people added yet. Type a name or import from bill above.',
              style: TextStyle(color: AppColors.textMuted, fontSize: 11, fontStyle: FontStyle.italic),
            ),
        ],
      ),
    );
  }
}
