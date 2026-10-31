import 'package:flutter/material.dart';
import '../../../models/split_types.dart';
import '../../../theme/app_theme.dart';

class AllocationToolbar extends StatelessWidget {
  final SplitMode mode;
  final bool hasPeople;
  final bool hasSelected;
  final String search;
  final int peopleCount;
  final VoidCallback onSelectEveryone;
  final VoidCallback onClear;
  final VoidCallback onSplitEvenly;
  final ValueChanged<String> onSearchChanged;

  const AllocationToolbar({
    super.key,
    required this.mode,
    required this.hasPeople,
    required this.hasSelected,
    required this.search,
    required this.peopleCount,
    required this.onSelectEveryone,
    required this.onClear,
    required this.onSplitEvenly,
    required this.onSearchChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            OutlinedButton.icon(
              icon: const Icon(Icons.group_rounded, size: 14),
              label: const Text('Everyone', style: TextStyle(fontSize: 12)),
              style: OutlinedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              ),
              onPressed: hasPeople ? onSelectEveryone : null,
            ),
            const SizedBox(width: 8),
            OutlinedButton(
              onPressed: hasSelected ? onClear : null,
              style: OutlinedButton.styleFrom(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              ),
              child: const Text('Clear', style: TextStyle(fontSize: 12)),
            ),
            if (mode != SplitMode.equal) ...[
              const SizedBox(width: 8),
              OutlinedButton(
                onPressed: hasSelected ? onSplitEvenly : null,
                style: OutlinedButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                ),
                child:
                    const Text('Split evenly', style: TextStyle(fontSize: 12)),
              ),
            ],
          ],
        ),
        if (peopleCount > 5) ...[
          const SizedBox(height: 10),
          SizedBox(
            height: 36,
            child: TextField(
              onChanged: onSearchChanged,
              style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search,
                    size: 16, color: AppColors.textMuted),
                hintText: 'Search $peopleCount people...',
                contentPadding: const EdgeInsets.symmetric(vertical: 6),
              ),
            ),
          ),
        ],
      ],
    );
  }
}
