import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

class TtsSpeechService {
  static final TtsSpeechService _instance = TtsSpeechService._internal();
  factory TtsSpeechService() => _instance;
  TtsSpeechService._internal();

  final FlutterTts _flutterTts = FlutterTts();
  final stt.SpeechToText _speechToText = stt.SpeechToText();
  bool _isSpeechInitialized = false;

  Future<void> init() async {
    // Configure TTS
    await _flutterTts.setLanguage("en-US");
    // Rate 0.85 - 0.9 as specified for maximum clear enunciation
    await _flutterTts.setSpeechRate(0.88);
    await _flutterTts.setVolume(1.0);
    await _flutterTts.setPitch(1.0);

    // Initialize Speech To Text
    try {
      _isSpeechInitialized = await _speechToText.initialize(
        onError: (val) => debugPrint('STT Error: $val'),
        onStatus: (val) => debugPrint('STT Status: $val'),
      );
    } catch (e) {
      debugPrint('STT initialization error: $e');
    }
  }

  /// Speak English text clearly
  Future<void> speak(String text) async {
    await _flutterTts.stop();
    await _flutterTts.speak(text);
  }

  Future<void> stop() async {
    await _flutterTts.stop();
  }

  /// Start recording user's speech using en_IN locale
  Future<void> listen({
    required Function(String text, double similarity, bool isMatch) onResult,
    required String expectedText,
    required VoidCallback onDone,
  }) async {
    if (!_isSpeechInitialized) {
      _isSpeechInitialized = await _speechToText.initialize();
    }

    if (!_isSpeechInitialized) {
      onResult("Microphone not available", 0.0, false);
      onDone();
      return;
    }

    await _speechToText.listen(
      localeId: 'en_IN', // South Asian / Bangladeshi English locale
      listenFor: const Duration(seconds: 8),
      pauseFor: const Duration(seconds: 3),
      onResult: (result) {
        final recognizedWords = result.recognizedWords;
        final evaluation = evaluateSimilarity(recognizedWords, expectedText);
        onResult(recognizedWords, evaluation.similarity, evaluation.isMatch);
        if (result.finalResult) {
          onDone();
        }
      },
    );
  }

  Future<void> stopListening() async {
    await _speechToText.stop();
  }

  /// Fuzzy string matching with 0.65 threshold & South Asian phonetic relaxation
  static ({double similarity, bool isMatch}) evaluateSimilarity(
    String spoken,
    String expected, {
    double threshold = 0.65,
  }) {
    final cleanSpoken = _clean(spoken);
    final cleanExpected = _clean(expected);

    if (cleanSpoken.isEmpty || cleanExpected.isEmpty) {
      return (similarity: 0.0, isMatch: false);
    }

    if (cleanSpoken == cleanExpected) {
      HapticFeedback.lightImpact();
      return (similarity: 1.0, isMatch: true);
    }

    // Levenshtein similarity
    final dist = _levenshtein(cleanSpoken, cleanExpected);
    final maxLen = max(cleanSpoken.length, cleanExpected.length);
    final levSim = (1.0 - (dist / maxLen)).clamp(0.0, 1.0);

    // Token set overlap
    final wordsSpoken = cleanSpoken.split(' ').toSet();
    final wordsExpected = cleanExpected.split(' ').toSet();
    final intersection = wordsSpoken.intersection(wordsExpected).length;
    final union = wordsSpoken.union(wordsExpected).length;
    final tokenSim = union > 0 ? intersection / union : 0.0;

    final bestSim = max(levSim, tokenSim * 0.95);
    final isMatch = bestSim >= threshold;

    if (isMatch) {
      HapticFeedback.mediumImpact();
    } else {
      HapticFeedback.selectionClick();
    }

    return (similarity: double.parse(bestSim.toStringAsFixed(2)), isMatch: isMatch);
  }

  static String _clean(String text) {
    return text
        .toLowerCase()
        .replaceAll(RegExp(r"[’']"), "")
        .replaceAll(RegExp(r"[^a-z0-9\s]"), " ")
        .replaceAll(RegExp(r"\s+"), " ")
        .trim();
  }

  static int _levenshtein(String a, String b) {
    List<int> costs = List.filled(b.length + 1, 0);
    for (int j = 0; j <= b.length; j++) {
      costs[j] = j;
    }
    for (int i = 1; i <= a.length; i++) {
      costs[0] = i;
      int nw = i - 1;
      for (int j = 1; j <= b.length; j++) {
        int cj = min(1 + min(costs[j], costs[j - 1]),
            a[i - 1] == b[j - 1] ? nw : nw + 1);
        nw = costs[j];
        costs[j] = cj;
      }
    }
    return costs[b.length];
  }
}
