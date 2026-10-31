import 'package:flutter/material.dart';
import '../../../models/split_types.dart';
import '../../common/person_avatar.dart';

class PerspectiveCardHeader extends StatelessWidget {
  final Person active;
  final int paid;
  final VoidCallback onSwitchProfile;

  const PerspectiveCardHeader({
    super.key,
    required this.active,
    required this.paid,
    required this.onSwitchProfile,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.08),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: PersonAvatar(
                    name: active.name,
                    photo: active.photo,
                    size: AvatarSize.md,
                    ring: false,
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 11,
                    height: 11,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Your Part — ${active.name}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 16,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.3,
                ),
              ),
            ),
            const SizedBox(width: 8),
            InkWell(
              onTap: onSwitchProfile,
              borderRadius: BorderRadius.circular(20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 4,
                      offset: const Offset(0, 1),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.switch_account_outlined, size: 13, color: Color(0xFF64748B)),
                    SizedBox(width: 4),
                    Text(
                      'Switch',
                      style: TextStyle(
                        color: Color(0xFF334155),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.keyboard_arrow_down_rounded, size: 13, color: Color(0xFF64748B)),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 6,
          runSpacing: 4,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                ),
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withValues(alpha: 0.35),
                    blurRadius: 6,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.bolt_rounded, size: 11, color: Colors.white),
                  SizedBox(width: 2),
                  Text(
                    'Active Profile',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 9.5,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ],
              ),
            ),
            Text(
              paid > 0
                  ? 'Head Payer · Perspective active'
                  : 'Participant · Perspective active',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 10.5,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
