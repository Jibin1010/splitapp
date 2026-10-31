import 'package:flutter/material.dart';
import '../../../core/dummy_people.dart';
import '../../../core/id.dart';
import '../../../models/split_types.dart';
import '../../../models/vision_types.dart';
import '../../../state/bill_state.dart';
import 'vision_dialog_models.dart';
import 'vision_gst_section.dart';
import 'vision_heads_tails.dart';
import 'vision_import_footer.dart';
import 'vision_people_section.dart';
import 'vision_products_table.dart';

class VisionDetectedItemsTab extends StatefulWidget {
  final BillState state;
  final VisionApiResponse result;
  final List<DetectedBillItem> initialDetectedItems;
  final VoidCallback onImportDone;

  const VisionDetectedItemsTab({
    super.key,
    required this.state,
    required this.result,
    required this.initialDetectedItems,
    required this.onImportDone,
  });

  @override
  State<VisionDetectedItemsTab> createState() => _VisionDetectedItemsTabState();
}

class _VisionDetectedItemsTabState extends State<VisionDetectedItemsTab> {
  late List<DialogPerson> _people;
  late List<EditableDetectedItem> _items;
  late bool _applyTax;
  late double _gstRupees;
  Map<String, double> _personGstShares = {};
  List<String> _headPersonIds = [];
  Map<String, double> _headPaidAmounts = {};
  Map<String, String> _tailHeadPreferences = {};
  bool _replaceItems = true;
  bool _isImporting = false;

  @override
  void initState() {
    super.initState();
    _initData();
  }

  void _initData() {
    // 1. People
    final billPeople = widget.state.bill.people;
    if (billPeople.isNotEmpty) {
      _people = billPeople.map((p) => DialogPerson(id: p.id, name: p.name, photo: p.photo)).toList();
    } else {
      _people = [
        DialogPerson(id: newId('person'), name: 'Alok', photo: getRandomAvatarForName('Alok')),
        DialogPerson(id: newId('person'), name: 'Priya', photo: getRandomAvatarForName('Priya')),
        DialogPerson(id: newId('person'), name: 'Rohan', photo: getRandomAvatarForName('Rohan')),
        DialogPerson(id: newId('person'), name: 'Sneha', photo: getRandomAvatarForName('Sneha')),
      ];
    }

    final allPersonIds = _people.map((p) => p.id).toList();

    // 2. Items
    _items = widget.initialDetectedItems.map((item) {
      return EditableDetectedItem(
        id: newId('item'),
        name: item.name,
        quantity: item.quantity,
        unitPricePaise: item.unitPricePaise,
        totalPaise: item.totalPaise,
        assignedParticipantIds: List.from(allPersonIds),
      );
    }).toList();

    // 3. Tax / GST
    final taxPaise = widget.result.taxPaise ?? 0;
    _applyTax = taxPaise > 0;
    _gstRupees = taxPaise > 0 ? (taxPaise / 100.0) : 0.0;

    _recalcGstShares();

    // 4. Heads & Tails
    if (_people.isNotEmpty) {
      final firstId = _people.first.id;
      _headPersonIds = [firstId];
      final totalBill = _calcTotalBillRupees();
      _headPaidAmounts = {firstId: totalBill};
    }
  }

  double _calcTotalBillRupees() {
    final subtotal = _items.fold<int>(0, (s, i) => s + i.totalPaise) / 100.0;
    return subtotal + (_applyTax ? _gstRupees : 0.0);
  }

  void _recalcGstShares() {
    if (_people.isEmpty) return;
    final equalShare = double.parse((100.0 / _people.length).toStringAsFixed(1));
    final shares = <String, double>{};
    double sum = 0.0;
    for (int i = 0; i < _people.length; i++) {
      final pid = _people[i].id;
      if (i == _people.length - 1) {
        shares[pid] = (100.0 - sum).clamp(0.0, 100.0);
      } else {
        shares[pid] = equalShare;
        sum += equalShare;
      }
    }
    _personGstShares = shares;
  }

  void _onImport() {
    setState(() => _isImporting = true);

    final productItems = _items.map((item) {
      final assigned = item.assignedParticipantIds.isEmpty
          ? _people.map((p) => p.id).toList()
          : item.assignedParticipantIds;

      return ProductItem(
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPricePaise,
        allocation: Allocation.equal(assigned),
      );
    }).toList();

    final people = _people.map((p) {
      final paidPaise = ((_headPaidAmounts[p.id] ?? 0.0) * 100).round();
      return Person(id: p.id, name: p.name, photo: p.photo, paidAmount: paidPaise);
    }).toList();

    final adjustments = <Adjustment>[];
    if (_applyTax && _gstRupees > 0) {
      adjustments.add(Adjustment(
        id: newId('adj'),
        label: 'GST / Tax',
        kind: AdjustmentKind.tax,
        method: AdjustmentMethod.fixed,
        value: (_gstRupees * 100).round().toDouble(),
        shares: _personGstShares,
      ));
    }

    final headPayers = <String, int>{
      for (final hid in _headPersonIds)
        hid: ((_headPaidAmounts[hid] ?? 0.0) * 100).round(),
    };

    widget.state.importAnalysisResult(
      items: productItems,
      people: people,
      adjustments: adjustments,
      headPayers: headPayers,
      billName: widget.result.vendor,
      date: widget.result.date,
      invoiceNumber: widget.result.invoiceNumber,
      replaceExistingItems: _replaceItems,
      replaceExistingPeople: false,
    );

    widget.onImportDone();
  }

  @override
  Widget build(BuildContext context) {
    final totalBillRupees = _calcTotalBillRupees();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Step 1: Participants
        VisionPeopleSection(
          people: _people,
          onChangedPeople: (updated) {
            setState(() {
              _people = updated;
              _recalcGstShares();
              if (_headPersonIds.isEmpty && _people.isNotEmpty) {
                _headPersonIds = [_people.first.id];
                _headPaidAmounts = {_people.first.id: totalBillRupees};
              }
            });
          },
          currentBillPeople: widget.state.bill.people,
        ),
        const SizedBox(height: 12),

        // Step 2: Products & Assignment
        VisionProductsTable(
          items: _items,
          people: _people,
          onChangedItems: (updated) => setState(() => _items = updated),
        ),
        const SizedBox(height: 12),

        // Step 3: GST Section
        VisionGstSection(
          items: _items,
          people: _people,
          applyTax: _applyTax,
          onToggleTax: (v) => setState(() => _applyTax = v),
          gstRupees: _gstRupees,
          onChangedGstRupees: (v) => setState(() => _gstRupees = v),
          personGstShares: _personGstShares,
          onChangedPersonGstShares: (s) => setState(() => _personGstShares = s),
        ),
        const SizedBox(height: 12),

        // Step 4: Heads & Tails Setup
        VisionHeadsTails(
          people: _people,
          headPersonIds: _headPersonIds,
          onChangedHeadPersonIds: (hids) => setState(() => _headPersonIds = hids),
          headPaidAmounts: _headPaidAmounts,
          onChangedHeadPaidAmounts: (amts) => setState(() => _headPaidAmounts = amts),
          tailHeadPreferences: _tailHeadPreferences,
          onChangedTailHeadPreferences: (prefs) => setState(() => _tailHeadPreferences = prefs),
          totalBillRupees: totalBillRupees,
        ),
        const SizedBox(height: 14),

        // Import Footer
        VisionImportFooter(
          replaceItems: _replaceItems,
          onToggleReplace: (v) => setState(() => _replaceItems = v),
          onImport: _onImport,
          onCancel: widget.onImportDone,
          isImporting: _isImporting,
          hasItems: _items.isNotEmpty,
        ),
      ],
    );
  }
}
