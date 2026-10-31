class Sentence {
  final int id;
  final String category;
  final String english;
  final String bengali;

  Sentence({
    required this.id,
    required this.category,
    required this.english,
    required this.bengali,
  });

  factory Sentence.fromCsv(List<dynamic> row) {
    return Sentence(
      id: int.tryParse(row[0].toString().trim()) ?? 0,
      category: row[1].toString().trim(),
      english: row[2].toString().trim(),
      bengali: row[3].toString().trim(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'category': category,
      'english': english,
      'bengali': bengali,
    };
  }
}
