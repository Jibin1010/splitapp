import 'package:flutter/material.dart';
import '../../../models/split_types.dart';
import 'perspective_net_card.dart';
import 'perspective_paid_card.dart';
import 'perspective_share_card.dart';

export 'perspective_net_card.dart';
export 'perspective_paid_card.dart';
export 'perspective_share_card.dart';

class PerspectiveMetricCards extends StatelessWidget {
  final int share;
  final int paid;
  final int net;
  final CurrencyCode currency;
  final double sharePercentage;
  final bool hasItems;

  const PerspectiveMetricCards({
    super.key,
    required this.share,
    required this.paid,
    required this.net,
    required this.currency,
    required this.sharePercentage,
    required this.hasItems,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: PerspectiveShareCard(
            share: share,
            currency: currency,
            sharePercentage: sharePercentage,
            hasItems: hasItems,
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: PerspectivePaidCard(
            paid: paid,
            currency: currency,
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: PerspectiveNetCard(
            net: net,
            currency: currency,
          ),
        ),
      ],
    );
  }
}
