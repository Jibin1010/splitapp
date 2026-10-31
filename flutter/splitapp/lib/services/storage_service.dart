import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/split_types.dart';

class StorageService {
  static const String _draftKey = 'splitledger.draft.v1';
  static const String _historyKey = 'splitledger.history.v1';
  static const String _settingsKey = 'splitledger.settings.v1';
  static const String _activePersonKey = 'splitledger.active_person.v1';
  static const int _maxHistoryEntries = 50;

  final SharedPreferences _prefs;

  StorageService(this._prefs);

  static Future<StorageService> init() async {
    final prefs = await SharedPreferences.getInstance();
    return StorageService(prefs);
  }

  String? loadActivePersonId() {
    return _prefs.getString(_activePersonKey);
  }

  Future<bool> saveActivePersonId(String id) async {
    return await _prefs.setString(_activePersonKey, id);
  }

  Bill? loadDraft() {
    try {
      final raw = _prefs.getString(_draftKey);
      if (raw == null || raw.isEmpty) return null;
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return Bill.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  Future<bool> saveDraft(Bill bill) async {
    try {
      final raw = jsonEncode(bill.toJson());
      return await _prefs.setString(_draftKey, raw);
    } catch (_) {
      return false;
    }
  }

  Future<void> clearDraft() async {
    await _prefs.remove(_draftKey);
  }

  List<HistoryEntry> loadHistory() {
    try {
      final raw = _prefs.getString(_historyKey);
      if (raw == null || raw.isEmpty) return [];
      final list = jsonDecode(raw) as List<dynamic>;
      return list
          .map((e) => HistoryEntry.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  Future<List<HistoryEntry>> addToHistory(Bill bill, CalculationResult? result) async {
    final entries = loadHistory();
    final newEntry = HistoryEntry(
      id: bill.id,
      savedAt: DateTime.now().toIso8601String(),
      bill: bill,
      result: result,
    );
    final withoutCurrent = entries.where((e) => e.id != bill.id).toList();
    final updated = [newEntry, ...withoutCurrent].take(_maxHistoryEntries).toList();
    await _prefs.setString(
      _historyKey,
      jsonEncode(updated.map((e) => e.toJson()).toList()),
    );
    return updated;
  }

  Future<List<HistoryEntry>> removeFromHistory(String entryId) async {
    final updated = loadHistory().where((e) => e.id != entryId).toList();
    await _prefs.setString(
      _historyKey,
      jsonEncode(updated.map((e) => e.toJson()).toList()),
    );
    return updated;
  }

  Settings loadSettings([CurrencyCode defaultCurrency = CurrencyCode.inr]) {
    try {
      final raw = _prefs.getString(_settingsKey);
      if (raw == null || raw.isEmpty) return Settings(currency: defaultCurrency);
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return Settings.fromJson(json);
    } catch (_) {
      return Settings(currency: defaultCurrency);
    }
  }

  Future<bool> saveSettings(Settings settings) async {
    try {
      return await _prefs.setString(_settingsKey, jsonEncode(settings.toJson()));
    } catch (_) {
      return false;
    }
  }

  Future<void> clearAllData() async {
    await _prefs.remove(_draftKey);
    await _prefs.remove(_historyKey);
    await _prefs.remove(_settingsKey);
  }
}
