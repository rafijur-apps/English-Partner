import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/sentence_practice_screen.dart';
import 'screens/vocabulary_test_screen.dart';
import 'services/tts_speech_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await TtsSpeechService().init();
  final prefs = await SharedPreferences.getInstance();
  final isDarkMode = prefs.getBool('is_dark_mode') ?? true;

  runApp(EnglishPartnerApp(initialDarkMode: isDarkMode));
}

class EnglishPartnerApp extends StatefulWidget {
  final bool initialDarkMode;
  const EnglishPartnerApp({super.key, required this.initialDarkMode});

  static _EnglishPartnerAppState of(BuildContext context) =>
      context.findAncestorStateOfType<_EnglishPartnerAppState>()!;

  @override
  State<EnglishPartnerApp> createState() => _EnglishPartnerAppState();
}

class _EnglishPartnerAppState extends State<EnglishPartnerApp> {
  late bool _isDarkMode;

  @override
  void initState() {
    super.initState();
    _isDarkMode = widget.initialDarkMode;
  }

  void toggleTheme() async {
    setState(() {
      _isDarkMode = !_isDarkMode;
    });
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('is_dark_mode', _isDarkMode);
  }

  bool get isDarkMode => _isDarkMode;

  @override
  Widget build(BuildContext context) {
    // Theme setup based on specifications:
    // Dark: #0F172A background, #1E293B card surface, #38BDF8 accent
    final darkTheme = ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: const Color(0xFF0F172A),
      cardColor: const Color(0xFF1E293B),
      colorScheme: const ColorScheme.dark(
        primary: Color(0xFF38BDF8),
        surface: Color(0xFF1E293B),
        onSurface: Color(0xFFF8FAFC),
        secondary: Color(0xFF0EA5E9),
      ),
      textTheme: GoogleFonts.hindSiliguriTextTheme(ThemeData.dark().textTheme),
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF0F172A),
        elevation: 0,
        centerTitle: false,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF0B1120),
        selectedItemColor: Color(0xFF38BDF8),
        unselectedItemColor: Color(0xFF94A3B8),
        elevation: 8,
      ),
    );

    final lightTheme = ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      cardColor: Colors.white,
      colorScheme: const ColorScheme.light(
        primary: Color(0xFF0284C7),
        surface: Colors.white,
        onSurface: Color(0xFF0F172A),
        secondary: Color(0xFF38BDF8),
      ),
      textTheme: GoogleFonts.hindSiliguriTextTheme(ThemeData.light().textTheme),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF0F172A),
        elevation: 0,
        centerTitle: false,
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: Color(0xFF0284C7),
        unselectedItemColor: Color(0xFF64748B),
        elevation: 8,
      ),
    );

    return MaterialApp(
      title: 'English Partner',
      debugShowCheckedModeBanner: false,
      theme: lightTheme,
      darkTheme: darkTheme,
      themeMode: _isDarkMode ? ThemeMode.dark : ThemeMode.light,
      home: const MainHomeScreen(),
    );
  }
}

class MainHomeScreen extends StatefulWidget {
  const MainHomeScreen({super.key});

  @override
  State<MainHomeScreen> createState() => _MainHomeScreenState();
}

class _MainHomeScreenState extends State<MainHomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    SentencePracticeScreen(),
    VocabularyTestScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = EnglishPartnerApp.of(context).isDarkMode;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Top App Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Theme.of(context).cardColor,
                border: Border(
                  bottom: BorderSide(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                    width: 1,
                  ),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF38BDF8).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.translate_rounded,
                      color: Color(0xFF38BDF8),
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'English Partner',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.onSurface,
                          ),
                        ),
                        Text(
                          _currentIndex == 0 ? '🗣️ বাক্য প্র্যাকটিস' : '📝 শব্দ ভাণ্ডার ও কুইজ',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    tooltip: isDark ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন',
                    icon: Icon(
                      isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                      color: const Color(0xFF38BDF8),
                    ),
                    onPressed: () {
                      EnglishPartnerApp.of(context).toggleTheme();
                    },
                  ),
                ],
              ),
            ),
            // Body Screen
            Expanded(child: _screens[_currentIndex]),
            // Footer Credit
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 12),
              color: isDark ? const Color(0xFF090D16) : const Color(0xFFF1F5F9),
              child: const Center(
                child: Text(
                  'This app made by Md. Rafijur Rahman (Zuboraj)',
                  style: TextStyle(
                    fontSize: 11,
                    letterSpacing: 0.3,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.record_voice_over_outlined),
            activeIcon: Icon(Icons.record_voice_over),
            label: '🗣️ বাক্য প্র্যাকটিস',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.quiz_outlined),
            activeIcon: Icon(Icons.quiz),
            label: '📝 শব্দ ভাণ্ডার ও টেস্ট',
          ),
        ],
      ),
    );
  }
}
