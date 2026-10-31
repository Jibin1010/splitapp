import 'dart:async';
import 'package:flutter/foundation.dart';
import '../core/calculations.dart';
import '../core/dummy_people.dart';
import '../core/id.dart';
import '../core/seed.dart';
import '../models/split_types.dart';
import '../services/storage_service.dart';

part 'bill_state_mutators.dart';

class BillState extends ChangeNotifier {
  final StorageService _storage;

  Bill _bill = createEmptyBill();
  CalculationResult? _result;
  bool _calculating = false;
  String? _errorMessage;
  List<ValidationIssue> _errorIssues = [];
  String? _savedAt;
  String? _draftSavedAt;
  String? _calculatedFromUpdatedAt;
  String? _activePersonId;
  Timer? _autosaveTimer;

  BillState(this._storage) {
    _hydrate();
  }

  Bill get bill => _bill;
  CalculationResult? get result => _result;
  bool get calculating => _calculating;
  String? get errorMessage => _errorMessage;
  List<ValidationIssue> get errorIssues => _errorIssues;
  String? get savedAt => _savedAt;
  String? get draftSavedAt => _draftSavedAt;
  String? get calculatedFromUpdatedAt => _calculatedFromUpdatedAt;
  String? get activePersonId => _activePersonId ?? activePerson?.id;

  /// Currently active person profile for personalized view and highlighting.
  Person? get activePerson {
    if (_bill.people.isEmpty) return null;
    if (_activePersonId != null) {
      final match =
          _bill.people.where((p) => p.id == _activePersonId).firstOrNull;
      if (match != null) return match;
    }
    // Default to the first person who made a payment, or the first person in list
    final payer = _bill.people.where((p) => p.paidAmount > 0).firstOrNull;
    return payer ?? _bill.people.firstOrNull;
  }

  /// Calculation result for the active person
  PersonResult? get activePersonResult {
    final ap = activePerson;
    if (ap == null) return null;
    return preview.people[ap.id];
  }

  void setActivePerson(String personId) {
    _activePersonId = personId;
    _storage.saveActivePersonId(personId);
    notifyListeners();
  }

  int getItemShareForActivePerson(String itemId) {
    final ap = activePerson;
    if (ap == null) return 0;
    return preview.itemAllocations[itemId]?[ap.id] ?? 0;
  }

  bool isItemAssignedToActivePerson(String itemId) {
    final ap = activePerson;
    if (ap == null) return false;
    return (preview.itemAllocations[itemId]?[ap.id] ?? 0) > 0;
  }

  /// Live client-side preview computed synchronously by the calculation engine.
  CalculationResult get preview => calculateBill(_bill);

  /// True when inputs were edited after the last successful calculation.
  bool get resultIsStale =>
      _result != null &&
      _calculatedFromUpdatedAt != null &&
      _bill.updatedAt != _calculatedFromUpdatedAt;

  void _touch() {
    _bill = _bill.copyWith(updatedAt: DateTime.now().toIso8601String());
    _scheduleAutosave();
    notifyListeners();
  }

  void _scheduleAutosave() {
    _autosaveTimer?.cancel();
    _autosaveTimer = Timer(const Duration(milliseconds: 600), () async {
      final success = await _storage.saveDraft(_bill);
      if (success) {
        _draftSavedAt = DateTime.now().toIso8601String();
        notifyListeners();
      }
    });
  }

  void _hydrate() {
    final draft = _storage.loadDraft();
    if (draft != null) {
      final shouldLoad50 = draft.people.isEmpty ||
          draft.items.any((i) => i.name.toLowerCase().contains('biriyani'));
      if (shouldLoad50) {
        load50DummyPeople();
      } else {
        _bill = draft;
      }
    } else {
      _bill = createSampleBill();
    }
    final savedActive = _storage.loadActivePersonId();
    if (savedActive != null && _bill.people.any((p) => p.id == savedActive)) {
      _activePersonId = savedActive;
    } else {
      // Default to Arjun to match "Arjun • YOU" in screenshots
      final arjun = _bill.people.where((p) => p.name.toLowerCase().contains('arjun')).firstOrNull;
      if (arjun != null) {
        _activePersonId = arjun.id;
      }
    }
    notifyListeners();
  }

  void loadSingleHeadPayerSample() {
    _bill = createSampleBill();
    final arjun = _bill.people.where((p) => p.name.toLowerCase().contains('arjun')).firstOrNull;
    if (arjun != null) {
      _activePersonId = arjun.id;
      _storage.saveActivePersonId(arjun.id);
    }
    _touch();
  }

  void loadMultiHeadPayerSample() {
    _bill = createMultiHeadPayerSampleBill();
    final arjun = _bill.people.where((p) => p.name.toLowerCase().contains('arjun')).firstOrNull;
    if (arjun != null) {
      _activePersonId = arjun.id;
      _storage.saveActivePersonId(arjun.id);
    }
    _touch();
  }

  void setBillName(String name) {
    _bill = _bill.copyWith(name: name);
    _touch();
  }

  void setBillVendor(String vendor) {
    _bill =
        _bill.copyWith(vendor: vendor.trim().isEmpty ? null : vendor.trim());
    _touch();
  }

  void setBillDate(String date) {
    _bill = _bill.copyWith(date: date.trim().isEmpty ? null : date.trim());
    _touch();
  }

  void setBillInvoiceNumber(String invoiceNumber) {
    _bill = _bill.copyWith(
        invoiceNumber:
            invoiceNumber.trim().isEmpty ? null : invoiceNumber.trim());
    _touch();
  }

  void setCurrency(CurrencyCode currency) {
    _bill = _bill.copyWith(currency: currency);
    _storage.saveSettings(Settings(currency: currency));
    _touch();
  }

  void load50DummyPeople() {
    _bill = _bill.copyWith(
      name: _bill.name.isEmpty ? 'Group Split' : _bill.name,
      items: const [],
      adjustments: const [],
      people: get50DummyPeople(),
      updatedAt: DateTime.now().toIso8601String(),
    );
    _result = null;
    _errorMessage = null;
    _errorIssues = [];
    _savedAt = null;
    _calculatedFromUpdatedAt = null;
    _scheduleAutosave();
    notifyListeners();
  }

  void clearItemsAndAdjustments() {
    _bill = _bill.copyWith(
      items: const [],
      adjustments: const [],
      updatedAt: DateTime.now().toIso8601String(),
    );
    _result = null;
    _errorMessage = null;
    _errorIssues = [];
    _scheduleAutosave();
    notifyListeners();
  }

  void newBill([CurrencyCode? currency]) {
    _bill = createEmptyBill(currency ?? _bill.currency);
    _result = null;
    _errorMessage = null;
    _errorIssues = [];
    _savedAt = null;
    _calculatedFromUpdatedAt = null;
    _scheduleAutosave();
    notifyListeners();
  }

  void loadBill(Bill loaded) {
    _bill = loaded;
    _result = null;
    _errorMessage = null;
    _errorIssues = [];
    _savedAt = null;
    _calculatedFromUpdatedAt = null;
    _scheduleAutosave();
    notifyListeners();
  }

  Future<void> saveNamedDraft() async {
    await _storage.addToHistory(_bill, _result);
    _savedAt = DateTime.now().toIso8601String();
    notifyListeners();
  }

  Future<void> calculateFinalSplit() async {
    _calculating = true;
    _errorMessage = null;
    _errorIssues = [];
    notifyListeners();

    // Small delay for smooth UI feedback like the Next.js API client
    await Future.delayed(const Duration(milliseconds: 150));

    try {
      final res = calculateBill(_bill);
      if (!res.valid) {
        _errorMessage =
            'The bill cannot be finalized yet. Fix the issues below and calculate again.';
        _errorIssues = res.issues;
      } else {
        _result = res;
        _calculatedFromUpdatedAt = _bill.updatedAt;
      }
    } catch (e) {
      _errorMessage = e.toString();
      _errorIssues = [];
    } finally {
      _calculating = false;
      notifyListeners();
    }
  }

  Future<void> resetAllData() async {
    await _storage.clearAllData();
    _bill = createSampleBill();
    _result = null;
    _errorMessage = null;
    _errorIssues = [];
    _savedAt = null;
    _draftSavedAt = null;
    _calculatedFromUpdatedAt = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _autosaveTimer?.cancel();
    super.dispose();
  }
}
