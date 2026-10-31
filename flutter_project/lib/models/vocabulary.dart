class Vocabulary {
  final int id;
  final String word;
  final String partOfSpeech;
  final String category;
  final String bengali;

  Vocabulary({
    required this.id,
    required this.word,
    required this.partOfSpeech,
    required this.category,
    required this.bengali,
  });

  factory Vocabulary.fromCsv(List<dynamic> row) {
    return Vocabulary(
      id: int.tryParse(row[0].toString().trim()) ?? 0,
      word: row[1].toString().trim(),
      partOfSpeech: row[2].toString().trim(),
      category: row[3].toString().trim(),
      bengali: row[4].toString().trim(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'word': word,
      'partOfSpeech': partOfSpeech,
      'category': category,
      'bengali': bengali,
    };
  }
}
