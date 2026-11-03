import importlib.util
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

spec = importlib.util.spec_from_file_location(
    "importer", Path(__file__).with_name("import-food-terms.py")
)
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


def dictionary():
    return ET.fromstring('''<LexicalResource><Lexicon version="2025">
      <LexicalEntry><Lemma writtenForm="ice_cream" partOfSpeech="n"/>
        <Sense synset="dessert"/></LexicalEntry>
      <LexicalEntry><Lemma writtenForm="Ice cream" partOfSpeech="n"/>
        <Sense synset="dessert"/></LexicalEntry>
      <LexicalEntry><Lemma writtenForm="iced tea" partOfSpeech="n"/>
        <Sense synset="tea"/></LexicalEntry>
      <LexicalEntry><Lemma writtenForm="straw" partOfSpeech="n"/>
        <Sense synset="hay"/></LexicalEntry>
      <LexicalEntry><Lemma writtenForm="meal" partOfSpeech="n"/>
        <Sense synset="occasion"/><Sense synset="flour"/></LexicalEntry>
      <LexicalEntry><Lemma writtenForm="turkey" partOfSpeech="n"/>
        <Sense synset="bird"/><Sense synset="meat"/></LexicalEntry>
      <LexicalEntry><Lemma writtenForm="drink" partOfSpeech="v"/>
        <Sense synset="tea"/></LexicalEntry>
      <LexicalEntry><Lemma writtenForm="tea" partOfSpeech="n"/>
        <Sense synset="tea"/><Sense synset="leaves"/></LexicalEntry>
      <LexicalEntry><Lemma writtenForm="nutrition" partOfSpeech="n"/>
        <Sense synset="nutrition"/></LexicalEntry>
      <Synset id="beverage" lexfile="noun.food"/>
      <Synset id="portion" lexfile="noun.food"/>
      <Synset id="drink-serving" lexfile="noun.food">
        <SynsetRelation relType="hypernym" target="portion"/></Synset>
      <Synset id="tea" lexfile="noun.food">
        <SynsetRelation relType="hypernym" target="drink-serving"/></Synset>
      <Synset id="dessert" lexfile="noun.food"/>
      <Synset id="feed" lexfile="noun.food"/>
      <Synset id="hay" lexfile="noun.food">
        <SynsetRelation relType="hypernym" target="feed"/></Synset>
      <Synset id="occasion" lexfile="noun.food"/>
      <Synset id="flour" lexfile="noun.food"/>
      <Synset id="bird" lexfile="noun.animal"/>
      <Synset id="meat" lexfile="noun.food"/>
      <Synset id="leaves" lexfile="noun.food"/>
      <Synset id="nutrition" lexfile="noun.food"/>
    </Lexicon></LexicalResource>''')


POLICY = {
    "version": "2025",
    "beverageSynsets": ["beverage", "drink-serving"],
    "excludedBranches": {"feed": "Animal feed", "occasion": "Meal occasions", "portion": "Quantities"},
    "excludedSynsets": {"nutrition": "Generic nourishment"},
}


class ImportTests(unittest.TestCase):
    def test_classifies_senses_and_preserves_whole_names(self):
        entries, audit = importer.extract(dictionary(), POLICY)
        by_name = {entry["name"]: entry for entry in entries}
        self.assertEqual(by_name["iced tea"]["category"], "drink")
        self.assertEqual(by_name["ice cream"]["synsets"], ["dessert"])
        self.assertEqual(by_name["turkey"]["synsets"], ["meat"])
        self.assertEqual(by_name["meal"]["synsets"], ["flour"])
        self.assertNotIn("straw", by_name)
        self.assertNotIn("nutrition", by_name)
        self.assertNotIn("drink", by_name)
        self.assertEqual(by_name["tea"]["category"], "drink")
        self.assertIn("tea", audit["ambiguousCategories"])
        self.assertEqual(len(entries), 5)

    def test_overrides_are_applied_after_dictionary_extraction(self):
        entries, _ = importer.extract(dictionary(), POLICY)
        result = importer.apply_overrides(entries, {
            "additions": [{"name": "Tea", "category": "food"},
                          {"name": "pumpkin", "category": "food"}],
            "exclusions": [{"name": "meal", "reason": "Too broad"}],
        })
        names = {entry["name"]: entry for entry in result}
        self.assertEqual(names["tea"]["category"], "food")
        self.assertEqual(names["pumpkin"]["synsets"], [])
        self.assertNotIn("meal", names)

    def test_rejects_incorrect_checksums_and_stale_policy(self):
        with self.assertRaises(ValueError):
            importer.verify_checksum(b"changed release", "0" * 64)
        with self.assertRaises(ValueError):
            importer.extract(dictionary(), {**POLICY, "beverageSynsets": ["missing"]})

    def test_rejects_conflicting_or_invalid_overrides(self):
        for additions in [
            [{"name": "tea", "category": "invalid"}],
            [{"name": "123", "category": "food"}],
            [{"name": "tea", "category": "food"}, {"name": "TEA", "category": "drink"}],
        ]:
            with self.assertRaises(ValueError):
                importer.apply_overrides([], {"additions": additions, "exclusions": []})

    def test_output_is_deterministic_and_cycles_terminate(self):
        root = dictionary()
        expected, _ = importer.extract(root, POLICY)
        root[0][:] = list(reversed(list(root[0])))
        actual, _ = importer.extract(root, POLICY)
        self.assertEqual(expected, actual)
        from collections import defaultdict
        graph = defaultdict(set, {"a": {"b"}, "b": {"a"}})
        self.assertEqual(importer.descendants(["a"], graph), {"a", "b"})


if __name__ == "__main__":
    unittest.main()
