import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:csv/csv.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/sentence.dart';
import '../services/tts_speech_service.dart';

class SentencePracticeScreen extends StatefulWidget {
  const SentencePracticeScreen({super.key});

  @override
  State<SentencePracticeScreen> createState() => _SentencePracticeScreenState();
}

class _SentencePracticeScreenState extends State<SentencePracticeScreen> {
  List<Sentence> _allSentences = [];
  List<Sentence> _filteredSentences = [];
  bool _isLoading = true;

  int _currentPage = 1;
  int _itemsPerPage = 10;
  String _searchQuery = '';
  String _selectedCategory = 'All';

  // Active speech recording state
  int? _activeRecordingSentenceId;
  String _recordedTranscript = '';
  double _lastSimilarity = 0.0;
  bool? _lastIsMatch;
  Set<int> _completedSentenceIds = {};

  final TextEditingController _searchController = TextEditingController();
  final TextEditingController _jumpPageController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadDataAndPreferences();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _jumpPageController.dispose();
    super.dispose();
  }

  Future<void> _loadDataAndPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final savedPage = prefs.getInt('sentence_page') ?? 1;
    final savedCompleted = prefs.getStringList('completed_sentences')?.map((e) => int.tryParse(e) ?? 0).toSet() ?? {};

    try {
      final csvString = await rootBundle.loadString('assets/spoken_english_500_sentences.csv');
      final rows = const CsvToListConverter(eol: '\n').convert(csvString);
      
      final List<Sentence> list = [];
      for (int i = 1; i < rows.length; i++) {
        if (rows[i].length >= 4) {
          list.add(Sentence.fromCsv(rows[i]));
        }
      }

      setState(() {
        _allSentences = list;
        _filteredSentences = list;
        _currentPage = savedPage;
        _completedSentenceIds = savedCompleted;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error loading sentences CSV: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _filterSentences() {
    setState(() {
      _filteredSentences = _allSentences.where((s) {
        final matchesCategory = _selectedCategory == 'All' || s.category.toLowerCase() == _selectedCategory.toLowerCase();
        final query = _searchQuery.toLowerCase();
        final matchesSearch = query.isEmpty ||
            s.english.toLowerCase().contains(query) ||
            s.bengali.toLowerCase().contains(query);
        return matchesCategory && matchesSearch;
      }).toList();
      _currentPage = 1;
    });
  }

  void _saveCurrentPage(int page) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('sentence_page', page);
  }

  void _markSentenceCompleted(int id) async {
    setState(() {
      _completedSentenceIds.add(id);
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      'completed_sentences',
      _completedSentenceIds.map((e) => e.toString()).toList(),
    );
  }

  int get _totalPages {
    if (_filteredSentences.isEmpty) return 1;
    return (_filteredSentences.length / _itemsPerPage).ceil();
  }

  List<Sentence> get _paginatedSentences {
    final startIndex = (_currentPage - 1) * _itemsPerPage;
    if (startIndex >= _filteredSentences.length) return [];
    final endIndex = (startIndex + _itemsPerPage).clamp(0, _filteredSentences.length);
    return _filteredSentences.sublist(startIndex, endIndex);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF38BDF8)),
      );
    }

    final categories = ['All', 'Conversational', 'Daily Life', 'Workplace', 'Data & Tech', 'Job Interview'];

    return Column(
      children: [
        // Top Search and Filter Bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
          child: Column(
            children: [
              // Search Field
              TextField(
                controller: _searchController,
                onChanged: (val) {
                  _searchQuery = val;
                  _filterSentences();
                },
                decoration: InputDecoration(
                  hintText: 'ইংরেজি বা বাংলায় বাক্য খুঁজুন (৫০০ বাক্য)...',
                  prefixIcon: const Icon(Icons.search, color: Color(0xFF38BDF8)),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            _searchQuery = '';
                            _filterSentences();
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                  contentPadding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                      color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                      color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              // Category filter pills
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: categories.map((cat) {
                    final isSelected = _selectedCategory == cat;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: ChoiceChip(
                        label: Text(
                          cat == 'All' ? 'সব ক্যাটাগরি' : cat,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? Colors.white : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF475569)),
                          ),
                        ),
                        selected: isSelected,
                        selectedColor: const Color(0xFF0284C7),
                        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                        onSelected: (val) {
                          setState(() {
                            _selectedCategory = cat;
                            _filterSentences();
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

        // Top Pagination Bar
        _buildPaginationBar(isDark),

        // Sentence Cards List
        Expanded(
          child: _filteredSentences.isEmpty
              ? Center(
                  child: Text(
                    'কোনো বাক্য পাওয়া যায়নি',
                    style: TextStyle(
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    ),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  itemCount: _paginatedSentences.length,
                  itemBuilder: (context, index) {
                    final item = _paginatedSentences[index];
                    return _buildSentenceCard(item, isDark);
                  },
                ),
        ),

        // Bottom Pagination Bar
        _buildPaginationBar(isDark),
      ],
    );
  }

  Widget _buildPaginationBar(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF131D31) : const Color(0xFFF1F5F9),
        border: Border.symmetric(
          horizontal: BorderSide(
            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Previous button
          TextButton.icon(
            onPressed: _currentPage > 1
                ? () {
                    setState(() {
                      _currentPage--;
                      _saveCurrentPage(_currentPage);
                    });
                  }
                : null,
            icon: const Icon(Icons.arrow_back_ios_rounded, size: 14),
            label: const Text('◀ আগের পাতা', style: TextStyle(fontSize: 12)),
          ),
          // Page Indicator & Jump Input
          Row(
            children: [
              Text(
                'পাতা $_currentPage / $_totalPages',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 44,
                height: 30,
                child: TextField(
                  controller: _jumpPageController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12),
                  decoration: InputDecoration(
                    hintText: 'Go',
                    contentPadding: EdgeInsets.zero,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  onSubmitted: (val) {
                    final p = int.tryParse(val);
                    if (p != null && p >= 1 && p <= _totalPages) {
                      setState(() {
                        _currentPage = p;
                        _saveCurrentPage(_currentPage);
                      });
                      _jumpPageController.clear();
                    }
                  },
                ),
              ),
            ],
          ),
          // Next button
          TextButton.icon(
            onPressed: _currentPage < _totalPages
                ? () {
                    setState(() {
                      _currentPage++;
                      _saveCurrentPage(_currentPage);
                    });
                  }
                : null,
            icon: const Text('পরের পাতা ▶', style: TextStyle(fontSize: 12)),
            label: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildSentenceCard(Sentence item, bool isDark) {
    final isRecording = _activeRecordingSentenceId == item.id;
    final isCompleted = _completedSentenceIds.contains(item.id);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isCompleted
              ? const Color(0xFF10B981).withOpacity(0.5)
              : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
          width: isCompleted ? 1.5 : 1,
        ),
      ),
      color: isDark ? const Color(0xFF1E293B) : Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row: Badge & Category
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0284C7).withOpacity(0.18),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '#${item.id}',
                        style: const TextStyle(
                          color: Color(0xFF38BDF8),
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      item.category,
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                if (isCompleted)
                  const Row(
                    children: [
                      Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 18),
                      SizedBox(width: 4),
                      Text(
                        'প্র্যাকটিস সম্পন্ন',
                        style: TextStyle(color: Color(0xFF10B981), fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
              ],
            ),
            const SizedBox(height: 10),

            // English Sentence
            Text(
              item.english,
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.w600,
                color: isDark ? const Color(0xFFF8FAFC) : const Color(0xFF0F172A),
                height: 1.35,
              ),
            ),
            const SizedBox(height: 10),

            // Bengali Meaning with accent border
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A).withOpacity(0.5) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
                border: const Border(
                  left: BorderSide(color: Color(0xFF38BDF8), width: 3.5),
                ),
              ),
              child: Text(
                item.bengali,
                style: TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w500,
                  color: isDark ? const Color(0xFF38BDF8) : const Color(0xFF0284C7),
                ),
              ),
            ),
            const SizedBox(height: 14),

            // Audio & Practice Speech Action Buttons
            Row(
              children: [
                // Listen Button
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                      foregroundColor: isDark ? Colors.white : const Color(0xFF0F172A),
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    onPressed: () {
                      TtsSpeechService().speak(item.english);
                    },
                    icon: const Icon(Icons.volume_up_rounded, color: Color(0xFF38BDF8), size: 18),
                    label: const Text('🔊 শুনুন', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 10),
                // Practice Speech Button
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isRecording ? const Color(0xFFEF4444) : const Color(0xFF0284C7),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    onPressed: () {
                      if (isRecording) {
                        TtsSpeechService().stopListening();
                        setState(() {
                          _activeRecordingSentenceId = null;
                        });
                      } else {
                        setState(() {
                          _activeRecordingSentenceId = item.id;
                          _recordedTranscript = '';
                          _lastSimilarity = 0.0;
                          _lastIsMatch = null;
                        });

                        TtsSpeechService().listen(
                          expectedText: item.english,
                          onResult: (text, sim, isMatch) {
                            setState(() {
                              _recordedTranscript = text;
                              _lastSimilarity = sim;
                              _lastIsMatch = isMatch;
                              if (isMatch) {
                                _markSentenceCompleted(item.id);
                              }
                            });
                          },
                          onDone: () {
                            setState(() {
                              _activeRecordingSentenceId = null;
                            });
                          },
                        );
                      }
                    },
                    icon: Icon(
                      isRecording ? Icons.stop_rounded : Icons.mic_rounded,
                      size: 18,
                    ),
                    label: Text(
                      isRecording ? 'থামুন...' : '🎙️ দেখে বলুন',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),

            // Live Speech Feedback Card
            if (_activeRecordingSentenceId == item.id || (_lastIsMatch != null && _activeRecordingSentenceId == null && _recordedTranscript.isNotEmpty))
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _lastIsMatch == true
                        ? const Color(0xFF10B981).withOpacity(0.12)
                        : const Color(0xFFF59E0B).withOpacity(0.12),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: _lastIsMatch == true ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'You said: "${_recordedTranscript.isEmpty ? 'শুনছি...' : _recordedTranscript}"',
                            style: TextStyle(
                              fontSize: 13,
                              fontStyle: FontStyle.italic,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                          ),
                          if (_lastIsMatch != null)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: _lastIsMatch == true ? const Color(0xFF10B981) : const Color(0xFFF59E0B),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                _lastIsMatch == true ? '✅ দারুণ উচ্চারণ!' : '⚠️ আবার বলুন',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'উচ্চারণ মিল: ${(_lastSimilarity * 100).toInt()}% (দক্ষিণ এশীয় অ্যাকসেন্ট টলারেন্স সক্রিয়)',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
