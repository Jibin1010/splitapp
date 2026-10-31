/**
 * 50 curated dummy people with full names and realistic portrait photos.
 * Uses high-availability RandomUser and Unsplash CDN portrait images.
 */
export const DUMMY_PEOPLE_RAW: Array<{ name: string; photo: string }> = [
  {
    name: 'Maya Sharma',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Arjun Patel',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Neha Rao',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ravi Kumar',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Priya Nair',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Rohan Gupta',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ananya Verma',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Vikram Singh',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sneha Reddy',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Karan Mehta',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Divya Joshi',
    photo: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Aditya Das',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Pooja Iyer',
    photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Rahul Roy',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Meera Bhat',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Amit Deshmukh',
    photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kavita Sen',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Siddharth Jain',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Shreya Malhotra',
    photo: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Rajesh Pillai',
    photo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tarun Kapoor',
    photo: 'https://randomuser.me/api/portraits/men/11.jpg',
  },
  {
    name: 'Ritu Saxena',
    photo: 'https://randomuser.me/api/portraits/women/12.jpg',
  },
  {
    name: 'Sandeep Chawla',
    photo: 'https://randomuser.me/api/portraits/men/13.jpg',
  },
  {
    name: 'Bhavna Kulkarni',
    photo: 'https://randomuser.me/api/portraits/women/14.jpg',
  },
  {
    name: 'Manoj Tiwari',
    photo: 'https://randomuser.me/api/portraits/men/15.jpg',
  },
  {
    name: 'Tanvi Agarwal',
    photo: 'https://randomuser.me/api/portraits/women/16.jpg',
  },
  {
    name: 'Gaurav Chopra',
    photo: 'https://randomuser.me/api/portraits/men/17.jpg',
  },
  {
    name: 'Rhea Chakraborty',
    photo: 'https://randomuser.me/api/portraits/women/18.jpg',
  },
  {
    name: 'Deepak Mishra',
    photo: 'https://randomuser.me/api/portraits/men/19.jpg',
  },
  {
    name: 'Swati Menon',
    photo: 'https://randomuser.me/api/portraits/women/20.jpg',
  },
  {
    name: 'Harsh Vardhan',
    photo: 'https://randomuser.me/api/portraits/men/21.jpg',
  },
  {
    name: 'Preeti Bansal',
    photo: 'https://randomuser.me/api/portraits/women/22.jpg',
  },
  {
    name: 'Nikhil Mathur',
    photo: 'https://randomuser.me/api/portraits/men/23.jpg',
  },
  {
    name: 'Simran Kaur',
    photo: 'https://randomuser.me/api/portraits/women/24.jpg',
  },
  {
    name: 'Abhishek Nambiar',
    photo: 'https://randomuser.me/api/portraits/men/25.jpg',
  },
  {
    name: 'Ishita Ganguly',
    photo: 'https://randomuser.me/api/portraits/women/26.jpg',
  },
  {
    name: 'Pranav Bajaj',
    photo: 'https://randomuser.me/api/portraits/men/27.jpg',
  },
  {
    name: 'Radhika Soni',
    photo: 'https://randomuser.me/api/portraits/women/28.jpg',
  },
  {
    name: 'Varun Grover',
    photo: 'https://randomuser.me/api/portraits/men/29.jpg',
  },
  {
    name: 'Anjali Bhattacharya',
    photo: 'https://randomuser.me/api/portraits/women/30.jpg',
  },
  {
    name: 'Ashwin Raman',
    photo: 'https://randomuser.me/api/portraits/men/31.jpg',
  },
  {
    name: 'Geeta Murthy',
    photo: 'https://randomuser.me/api/portraits/women/32.jpg',
  },
  {
    name: 'Kunal Singhania',
    photo: 'https://randomuser.me/api/portraits/men/33.jpg',
  },
  {
    name: 'Pallavi Rao',
    photo: 'https://randomuser.me/api/portraits/women/34.jpg',
  },
  {
    name: 'Sameer Qureshi',
    photo: 'https://randomuser.me/api/portraits/men/35.jpg',
  },
  {
    name: 'Sunita Narain',
    photo: 'https://randomuser.me/api/portraits/women/36.jpg',
  },
  {
    name: 'Devendra Pandey',
    photo: 'https://randomuser.me/api/portraits/men/37.jpg',
  },
  {
    name: 'Vandana Shiva',
    photo: 'https://randomuser.me/api/portraits/women/38.jpg',
  },
  {
    name: 'Manish Kashyap',
    photo: 'https://randomuser.me/api/portraits/men/39.jpg',
  },
  {
    name: 'Komal Sethi',
    photo: 'https://randomuser.me/api/portraits/women/40.jpg',
  },
]

/**
 * Extended name suggestions covering all letters of the alphabet A-Z.
 */
export const ALL_SUGGESTED_NAMES: Array<{ name: string; photo: string }> = [
  ...DUMMY_PEOPLE_RAW,
  { name: 'Alok Kumar', photo: 'https://randomuser.me/api/portraits/men/27.jpg' },
  { name: 'Aarav Patel', photo: 'https://randomuser.me/api/portraits/men/41.jpg' },
  { name: 'Alice Smith', photo: 'https://randomuser.me/api/portraits/women/41.jpg' },
  { name: 'Bhavna Shah', photo: 'https://randomuser.me/api/portraits/women/42.jpg' },
  { name: 'Bharat Verma', photo: 'https://randomuser.me/api/portraits/men/42.jpg' },
  { name: 'Bob Johnson', photo: 'https://randomuser.me/api/portraits/men/43.jpg' },
  { name: 'Chetan Bhagat', photo: 'https://randomuser.me/api/portraits/men/44.jpg' },
  { name: 'Charlie Puth', photo: 'https://randomuser.me/api/portraits/men/45.jpg' },
  { name: 'Esha Gupta', photo: 'https://randomuser.me/api/portraits/women/43.jpg' },
  { name: 'Ethan Hunt', photo: 'https://randomuser.me/api/portraits/men/46.jpg' },
  { name: 'Farhan Akhtar', photo: 'https://randomuser.me/api/portraits/men/47.jpg' },
  { name: 'Fatima Sana', photo: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { name: 'Ishan Kishan', photo: 'https://randomuser.me/api/portraits/men/48.jpg' },
  { name: 'Isha Ambani', photo: 'https://randomuser.me/api/portraits/women/45.jpg' },
  { name: 'Jibin Mathew', photo: 'https://randomuser.me/api/portraits/men/49.jpg' },
  { name: 'Jayant Sinha', photo: 'https://randomuser.me/api/portraits/men/50.jpg' },
  { name: 'Laxmi Mittal', photo: 'https://randomuser.me/api/portraits/men/51.jpg' },
  { name: 'Liam Wilson', photo: 'https://randomuser.me/api/portraits/men/52.jpg' },
  { name: 'Om Puri', photo: 'https://randomuser.me/api/portraits/men/53.jpg' },
  { name: 'Oliver Queen', photo: 'https://randomuser.me/api/portraits/men/54.jpg' },
  { name: 'Qasim Ali', photo: 'https://randomuser.me/api/portraits/men/55.jpg' },
  { name: 'Queenie Singh', photo: 'https://randomuser.me/api/portraits/women/46.jpg' },
  { name: 'Uday Kotak', photo: 'https://randomuser.me/api/portraits/men/56.jpg' },
  { name: 'Uma Bharti', photo: 'https://randomuser.me/api/portraits/women/47.jpg' },
  { name: 'Wasim Akram', photo: 'https://randomuser.me/api/portraits/men/57.jpg' },
  { name: 'William Miller', photo: 'https://randomuser.me/api/portraits/men/58.jpg' },
  { name: 'Xavier Lopez', photo: 'https://randomuser.me/api/portraits/men/59.jpg' },
  { name: 'Yash Chopra', photo: 'https://randomuser.me/api/portraits/men/60.jpg' },
  { name: 'Yuvraj Singh', photo: 'https://randomuser.me/api/portraits/men/61.jpg' },
  { name: 'Zaheer Khan', photo: 'https://randomuser.me/api/portraits/men/62.jpg' },
  { name: 'Zoya Akhtar', photo: 'https://randomuser.me/api/portraits/women/48.jpg' },
]
