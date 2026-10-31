import '../models/split_types.dart';
import 'id.dart';

class DummyPersonData {
  final String name;
  final String photo;
  const DummyPersonData({required this.name, required this.photo});
}

typedef DummyPersonSeed = DummyPersonData;

List<DummyPersonData> searchPeopleSuggestions(String query, [List<String> excludedNames = const []]) {
  final q = query.trim().toLowerCase();
  final excluded = excludedNames.map((e) => e.toLowerCase()).toSet();
  return dummyPeopleRaw.where((p) {
    if (excluded.contains(p.name.toLowerCase())) return false;
    return p.name.toLowerCase().contains(q);
  }).toList();
}

/// 50 curated dummy people with full names and realistic portrait photos.
/// Matches ReactNext curated dummy people list.
const List<DummyPersonData> dummyPeopleRaw = [
  DummyPersonData(
    name: 'Maya Sharma',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Arjun Patel',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Neha Rao',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Ravi Kumar',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Priya Nair',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Rohan Gupta',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Ananya Verma',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Vikram Singh',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Sneha Reddy',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Karan Mehta',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Divya Joshi',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Aditya Das',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Pooja Iyer',
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Rahul Roy',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Meera Bhat',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Amit Deshmukh',
    photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Kavita Sen',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Siddharth Jain',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Shreya Malhotra',
    photo: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Rajesh Pillai',
    photo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  ),
  DummyPersonData(
    name: 'Tarun Kapoor',
    photo: 'https://randomuser.me/api/portraits/men/11.jpg',
  ),
  DummyPersonData(
    name: 'Ritu Saxena',
    photo: 'https://randomuser.me/api/portraits/women/12.jpg',
  ),
  DummyPersonData(
    name: 'Sandeep Chawla',
    photo: 'https://randomuser.me/api/portraits/men/13.jpg',
  ),
  DummyPersonData(
    name: 'Tanvi Kulkarni',
    photo: 'https://randomuser.me/api/portraits/women/14.jpg',
  ),
  DummyPersonData(
    name: 'Nikhil Nair',
    photo: 'https://randomuser.me/api/portraits/men/15.jpg',
  ),
  DummyPersonData(
    name: 'Swati Agarwal',
    photo: 'https://randomuser.me/api/portraits/women/16.jpg',
  ),
  DummyPersonData(
    name: 'Varun Menon',
    photo: 'https://randomuser.me/api/portraits/men/17.jpg',
  ),
  DummyPersonData(
    name: 'Sunita Prasad',
    photo: 'https://randomuser.me/api/portraits/women/18.jpg',
  ),
  DummyPersonData(
    name: 'Deepak Bhatt',
    photo: 'https://randomuser.me/api/portraits/men/19.jpg',
  ),
  DummyPersonData(
    name: 'Shalini Nambiar',
    photo: 'https://randomuser.me/api/portraits/women/20.jpg',
  ),
  DummyPersonData(
    name: 'Manoj Tiwari',
    photo: 'https://randomuser.me/api/portraits/men/21.jpg',
  ),
  DummyPersonData(
    name: 'Rekha Hegde',
    photo: 'https://randomuser.me/api/portraits/women/22.jpg',
  ),
  DummyPersonData(
    name: 'Gaurav Bansal',
    photo: 'https://randomuser.me/api/portraits/men/23.jpg',
  ),
  DummyPersonData(
    name: 'Preeti Kaushik',
    photo: 'https://randomuser.me/api/portraits/women/24.jpg',
  ),
  DummyPersonData(
    name: 'Harish Natarajan',
    photo: 'https://randomuser.me/api/portraits/men/25.jpg',
  ),
  DummyPersonData(
    name: 'Simran Grover',
    photo: 'https://randomuser.me/api/portraits/women/26.jpg',
  ),
  DummyPersonData(
    name: 'Alok Mishra',
    photo: 'https://randomuser.me/api/portraits/men/27.jpg',
  ),
  DummyPersonData(
    name: 'Shruti Pai',
    photo: 'https://randomuser.me/api/portraits/women/28.jpg',
  ),
  DummyPersonData(
    name: 'Rohit Choudhury',
    photo: 'https://randomuser.me/api/portraits/men/29.jpg',
  ),
  DummyPersonData(
    name: 'Pallavi Shenoy',
    photo: 'https://randomuser.me/api/portraits/women/30.jpg',
  ),
  DummyPersonData(
    name: 'Vivek Mathur',
    photo: 'https://randomuser.me/api/portraits/men/31.jpg',
  ),
  DummyPersonData(
    name: 'Radhika Soni',
    photo: 'https://randomuser.me/api/portraits/women/32.jpg',
  ),
  DummyPersonData(
    name: 'Kunal Ghosh',
    photo: 'https://randomuser.me/api/portraits/men/33.jpg',
  ),
  DummyPersonData(
    name: 'Vandana Pillai',
    photo: 'https://randomuser.me/api/portraits/women/34.jpg',
  ),
  DummyPersonData(
    name: 'Abhishek Bose',
    photo: 'https://randomuser.me/api/portraits/men/35.jpg',
  ),
  DummyPersonData(
    name: 'Archana Nanda',
    photo: 'https://randomuser.me/api/portraits/women/36.jpg',
  ),
  DummyPersonData(
    name: 'Ashish Rawat',
    photo: 'https://randomuser.me/api/portraits/men/37.jpg',
  ),
  DummyPersonData(
    name: 'Rashmi Dave',
    photo: 'https://randomuser.me/api/portraits/women/38.jpg',
  ),
  DummyPersonData(
    name: 'Manish Kashyap',
    photo: 'https://randomuser.me/api/portraits/men/39.jpg',
  ),
  DummyPersonData(
    name: 'Komal Sethi',
    photo: 'https://randomuser.me/api/portraits/women/40.jpg',
  ),
];

/// Returns 50 fresh Person objects with unique IDs, realistic names and photos.
List<Person> get50DummyPeople() {
  return dummyPeopleRaw.map((person) {
    return Person(
      id: newId('person'),
      name: person.name,
      photo: person.photo,
      paidAmount: 0,
    );
  }).toList();
}

/// Creates a clean bill with 0 items, 0 adjustments, and all 50 dummy people.
Bill create50PeopleBill([CurrencyCode currency = CurrencyCode.inr]) {
  final now = DateTime.now().toIso8601String();
  return Bill(
    id: newId('bill'),
    name: 'Group Split',
    currency: currency,
    items: const [],
    adjustments: const [],
    people: get50DummyPeople(),
    createdAt: now,
    updatedAt: now,
  );
}

/// Pick an avatar from the curated list for any newly created person by name hash.
String getRandomAvatarForName(String name) {
  if (name.trim().isEmpty) return dummyPeopleRaw[0].photo;
  int hash = 0;
  for (int i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.codeUnitAt(i);
    hash = hash & 0xFFFFFFFF; // 32-bit int simulation
  }
  final index = hash.abs() % dummyPeopleRaw.length;
  return dummyPeopleRaw[index].photo;
}
