import 'package:flutter/material.dart';
import '../../models/split_types.dart';
import '../../theme/app_theme.dart';

class SplitCalculationErrorBanner extends StatelessWidget {
  final String errorMessage;
  final List<ValidationIssue> errorIssues;

  const SplitCalculationErrorBanner({
    super.key,
    required this.errorMessage,
    required this.errorIssues,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.dangerSubtle,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.danger.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.warning_amber_rounded,
                  size: 16, color: AppColors.danger),
              SizedBox(width: 6),
              Text(
                'Calculation failed',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.danger,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            errorMessage,
            style: const TextStyle(fontSize: 12, color: AppColors.danger),
          ),
          if (errorIssues.isNotEmpty) ...[
            const SizedBox(height: 6),
            for (final issue in errorIssues)
              Padding(
                padding: const EdgeInsets.only(left: 14, top: 2),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('• ',
                        style: TextStyle(color: AppColors.danger)),
                    Expanded(
                      child: Text(
                        issue.message,
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.danger),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class SplitLiveBlockersBanner extends StatelessWidget {
  final List<ValidationIssue> liveIssues;

  const SplitLiveBlockersBanner({super.key, required this.liveIssues});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.warningSubtle,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Before calculating, fix ${liveIssues.length == 1 ? 'this issue' : 'these ${liveIssues.length} issues'}:',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.warning,
            ),
          ),
          const SizedBox(height: 4),
          for (final issue in liveIssues.take(4))
            Padding(
              padding: const EdgeInsets.only(left: 8, top: 2),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('• ',
                      style: TextStyle(color: AppColors.warning)),
                  Expanded(
                    child: Text(
                      issue.message,
                      style: const TextStyle(
                          fontSize: 11, color: AppColors.warning),
                    ),
                  ),
                ],
              ),
            ),
          if (liveIssues.length > 4)
            Padding(
              padding: const EdgeInsets.only(left: 8, top: 2),
              child: Text(
                '…and ${liveIssues.length - 4} more',
                style:
                    const TextStyle(fontSize: 11, color: AppColors.warning),
              ),
            ),
        ],
      ),
    );
  }
}
