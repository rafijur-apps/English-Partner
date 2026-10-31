import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:csv/csv.dart';
import '../models/vocabulary.dart';
import '../services/tts_speech_service.dart';

class VocabularyTestScreen extends StatefulWidget {
  const VocabularyTestScreen({super.key});

  @override
  State<VocabularyTestScreen> createState() => _VocabularyTestScreenState();
}

class _VocabularyTestScreenState extends State<VocabularyTestScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Vocabulary> _allVocabulary = [];
  bool _isLoading = true;

  // Range State
  int _rangeStart = 1;
  int _rangeEnd = 50;
  final TextEditingController _customStartController = TextEditingController();
  final TextEditingController _customEndController = TextEditingController();
  final TextEditingController _searchWordController = TextEditingController();
  String _wordSearchQuery = '';

  // Quiz State
  int _quizIndex = 0;
  int _score = 0;
  bool _quizCompleted = false;
  String? _selectedAnswer;
  bool _isAnswerSubmitted = false;
  List<String> _currentOptions = [];

  final List<({int start, int end, String label})> _presetRanges = [
    (start: 1, end: 50, label: '1-50'),
    (start: 51, end: 100, label: '51-100'),
    (start: 101, end: 150, label: '101-150'),
    (start: 151, end: 200, label: '151-200'),
    (start: 201, end: 250, label: '201-250'),
    (start: 251, end: 300, label: '251-300'),
    (start: 301, end: 400, label: '301-400'),
    (start: 401, end: 500, label: '401-500'),
    (start: 1, end: 500, label: '1-500 (সব)'),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadVocabulary();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _customStartController.dispose();
    _customEndController.dispose();
    _searchWordController.dispose();
    super.dispose();
  }

  Future<void> _loadVocabulary() async {
    try {
      final csvString = await rootBundle.loadString('assets/spoken_english_500_vocabulary.csv');
      final rows = const CsvToListConverter(eol: '\n').convert(csvString);

      final List<Vocabulary> list = [];
      for (int i = 1; i < rows.length; i++) {
        if (rows[i].length >= 5) {
          list.add(Vocabulary.fromCsv(rows[i]));
        }
      }

      setState(() {
        _allVocabulary = list;
        _isLoading = false;
      });
      _generateOptionsForCurrentQuestion();
    } catch (e) {
      debugPrint('Error loading vocabulary CSV: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  List<Vocabulary> get _activeRangeWords {
    return _allVocabulary.where((w) => w.id >= _rangeStart && w.id <= _rangeEnd).toList();
  }

  List<Vocabulary> get _filteredStudyWords {
    final query = _wordSearchQuery.toLowerCase();
    return _activeRangeWords.where((w) {
      return query.isEmpty ||
          w.word.toLowerCase().contains(query) ||
          w.bengali.toLowerCase().contains(query);
    }).toList();
  }

  void _generateOptionsForCurrentQuestion() {
    final words = _activeRangeWords;
    if (words.isEmpty || _quizIndex >= words.length) return;

    final target = words[_quizIndex];
    final correctMeaning = target.bengali;

    // Gather 3 distinct random distractors from dataset
    final otherMeanings = _allVocabulary
        .where((w) => w.bengali != correctMeaning)
        .map((w) => w.bengali)
        .toSet()
        .toList();

    otherMeanings.shuffle(Random());
    final distractors = otherMeanings.take(3).toList();

    final options = [correctMeaning, ...distractors];
    options.shuffle(Random());

    setState(() {
      _currentOptions = options;
      _selectedAnswer = null;
      _isAnswerSubmitted = false;
    });
  }

  void _onAnswerSelected(String option) {
    if (_isAnswerSubmitted) return;

    final words = _activeRangeWords;
    final currentTarget = words[_quizIndex];
    final isCorrect = option == currentTarget.bengali;

    setState(() {
      _selectedAnswer = option;
      _isAnswerSubmitted = true;
      if (isCorrect) {
        _score++;
      }
    });

    if (isCorrect) {
      // Auto-advance after 1.2s on correct answer as specified
      Future.delayed(const Duration(milliseconds: 1200), () {
        if (mounted) _goToNextQuestion();
      });
    }
  }

  void _goToNextQuestion() {
    final words = _activeRangeWords;
    if (_quizIndex + 1 < words.length) {
      setState(() {
        _quizIndex++;
      });
      _generateOptionsForCurrentQuestion();
    } else {
      setState(() {
        _quizCompleted = true;
      });
    }
  }

  void _restartQuiz() {
    setState(() {
      _quizIndex = 0;
      _score = 0;
      _quizCompleted = false;
      _selectedAnswer = null;
      _isAnswerSubmitted = false;
    });
    _generateOptionsForCurrentQuestion();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)));
    }

    return Column(
      children: [
        // Range Selector Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'রেঞ্জ নির্বাচন (শব্দ $_rangeStart থেকে $_rangeEnd):',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                  // Custom Range Inputs
                  Row(
                    children: [
                      SizedBox(
                        width: 45,
                        height: 28,
                        child: TextField(
                          controller: _customStartController,
                          keyboardType: TextInputType.number,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 11),
                          decoration: InputDecoration(
                            hintText: '$_rangeStart',
                            contentPadding: EdgeInsets.zero,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          ),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 4),
                        child: Text('-'),
                      ),
                      SizedBox(
                        width: 45,
                        height: 28,
                        child: TextField(
                          controller: _customEndController,
                          keyboardType: TextInputType.number,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 11),
                          decoration: InputDecoration(
                            hintText: '$_rangeEnd',
                            contentPadding: EdgeInsets.zero,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 4),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0284C7),
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: const Size(36, 28),
                        ),
                        onPressed: () {
                          final s = int.tryParse(_customStartController.text);
                          final e = int.tryParse(_customEndController.text);
                          if (s != null && e != null && s <= e && s >= 1 && e <= 500) {
                            setState(() {
                              _rangeStart = s;
                              _rangeEnd = e;
                              _restartQuiz();
                            });
                          }
                        },
                        child: const Text('সেট', style: TextStyle(fontSize: 11, color: Colors.white)),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 6),
              // Preset range pills
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: _presetRanges.map((r) {
                    final isSelected = _rangeStart == r.start && _rangeEnd == r.end;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ActionChip(
                        label: Text(
                          r.label,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF334155)),
                          ),
                        ),
                        backgroundColor: isSelected
                            ? const Color(0xFF0284C7)
                            : (isDark ? const Color(0xFF1E293B) : Colors.white),
                        onPressed: () {
                          setState(() {
                            _rangeStart = r.start;
                            _rangeEnd = r.end;
                            _restartQuiz();
                          });
                        },
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),

        // Sub-Tab Bar
        Container(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          child: TabBar(
            controller: _tabController,
            labelColor: const Color(0xFF38BDF8),
            unselectedLabelColor: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
            indicatorColor: const Color(0xFF38BDF8),
            tabs: const [
              Tab(text: '📚 শব্দ ভাণ্ডার (Study List)'),
              Tab(text: '🎯 ৪-অপশন এমসিকিউ টেস্ট'),
            ],
          ),
        ),

        // Sub-Tab Views
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildStudyListTab(isDark),
              _buildMcqQuizTab(isDark),
            ],
          ),
        ),
      ],
    );
  }

  // Sub-Tab A: Study List
  Widget _buildStudyListTab(bool isDark) {
    final list = _filteredStudyWords;

    return Column(
      children: [
        // Search inside range
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: TextField(
            controller: _searchWordController,
            onChanged: (val) {
              setState(() {
                _wordSearchQuery = val;
              });
            },
            decoration: InputDecoration(
              hintText: 'এই রেঞ্জে শব্দ খুঁজুন (${_activeRangeWords.length}টি শব্দ)...',
              prefixIcon: const Icon(Icons.search, size: 20, color: Color(0xFF38BDF8)),
              filled: true,
              fillColor: isDark ? const Color(0xFF1E293B) : Colors.white,
              contentPadding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)),
              ),
            ),
          ),
        ),

        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
            itemCount: list.length,
            itemBuilder: (context, index) {
              final vocab = list[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  child: Row(
                    children: [
                      // Word ID badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0284C7).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '#${vocab.id}',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      // Word details
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Text(
                                  vocab.word,
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? Colors.white : Colors.black87,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    vocab.partOfSpeech,
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 3),
                            Text(
                              vocab.bengali,
                              style: const TextStyle(
                                fontSize: 13.5,
                                color: Color(0xFF38BDF8),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Pronounce Speaker Button
                      IconButton(
                        icon: const Icon(Icons.volume_up_rounded, color: Color(0xFF38BDF8)),
                        onPressed: () {
                          TtsSpeechService().speak(vocab.word);
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // Sub-Tab B: 4-Option MCQ Test
  Widget _buildMcqQuizTab(bool isDark) {
    final words = _activeRangeWords;
    if (words.isEmpty) {
      return const Center(child: Text('এই রেঞ্জে কোনো শব্দ নেই'));
    }

    if (_quizCompleted) {
      final percentage = (words.isNotEmpty ? (_score / words.length * 100).round() : 0);
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text('🎉 কুইজ সমাপ্ত!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Text('আপনার স্কোর: $_score / ${words.length}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Text('সাফল্যের হার: $percentage%', style: const TextStyle(fontSize: 16, color: Color(0xFF38BDF8), fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0284C7),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _restartQuiz,
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('আবার টেস্ট দিন', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final target = words[_quizIndex];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Progress & Score Bar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'প্রশ্ন ${_quizIndex + 1} / ${words.length}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
              ),
              Text(
                'স্কোর: $_score / ${_quizIndex + (_isAnswerSubmitted && _selectedAnswer == target.bengali ? 1 : 0)}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF38BDF8)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: (_quizIndex + 1) / words.length,
              minHeight: 8,
              backgroundColor: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
              color: const Color(0xFF38BDF8),
            ),
          ),
          const SizedBox(height: 20),

          // Target Word Question Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
              ),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      target.word,
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(width: 10),
                    IconButton(
                      icon: const Icon(Icons.volume_up_rounded, color: Color(0xFF38BDF8), size: 26),
                      onPressed: () {
                        TtsSpeechService().speak(target.word);
                      },
                    ),
                  ],
                ),
                Text(
                  '${target.partOfSpeech} · ${target.category}',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'সঠিক বাংলা অর্থ কোনটি?',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF38BDF8)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // 4 Interactive Options (A, B, C, D)
          Column(
            children: _currentOptions.asMap().entries.map((entry) {
              final idx = entry.key;
              final option = entry.value;
              final optionLabel = String.fromCharCode(65 + idx); // A, B, C, D

              Color btnColor = isDark ? const Color(0xFF1E293B) : Colors.white;
              Color borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1);
              Color textColor = isDark ? Colors.white : const Color(0xFF0F172A);

              if (_isAnswerSubmitted) {
                if (option == target.bengali) {
                  // Correct option always green
                  btnColor = const Color(0xFF10B981).withOpacity(0.2);
                  borderColor = const Color(0xFF10B981);
                  textColor = const Color(0xFF10B981);
                } else if (_selectedAnswer == option) {
                  // Selected wrong option turns red
                  btnColor = const Color(0xFFEF4444).withOpacity(0.2);
                  borderColor = const Color(0xFFEF4444);
                  textColor = const Color(0xFFEF4444);
                }
              }

              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: InkWell(
                  onTap: () => _onAnswerSelected(option),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: btnColor,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderColor, width: 1.5),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: borderColor.withOpacity(0.2),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            optionLabel,
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: textColor),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Text(
                            option,
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500, color: textColor),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }).toList(),
          ),

          // Next button on wrong answer
          if (_isAnswerSubmitted && _selectedAnswer != target.bengali)
            Padding(
              padding: const EdgeInsets.only(top: 10),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0284C7),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: _goToNextQuestion,
                  icon: const Icon(Icons.arrow_forward_rounded),
                  label: const Text('পরবর্তী শব্দ ▶', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
