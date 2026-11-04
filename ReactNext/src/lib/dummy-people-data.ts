/**
 * 1,000 Curated Dummy People with Real Portrait Photos and Verified E.164 Phone Numbers.
 * Supports instant search, autocomplete, and massive scale performance testing.
 */

export interface DummyPersonRaw {
  name: string
  photo: string
  phone: string
  isPhoneVerified: boolean
}

const maleFirst = [
  'Aarav', 'Arjun', 'Aditya', 'Alok', 'Aryan', 'Ankit', 'Ayush', 'Bharat', 'Bob', 'Chetan',
  'Charlie', 'Deepak', 'Dev', 'Dhruv', 'Farhan', 'Gautam', 'Hardik', 'Harsh', 'Ishan', 'Jayant',
  'Jibin', 'Karan', 'Kabir', 'Kunal', 'Liam', 'Madhav', 'Manish', 'Naveen', 'Neil', 'Nikhil',
  'Om', 'Oliver', 'Pranav', 'Rahul', 'Raj', 'Ravi', 'Rohan', 'Rohit', 'Sachin', 'Sameer',
  'Sanjay', 'Siddharth', 'Sunil', 'Suresh', 'Tanmay', 'Tarun', 'Uday', 'Varun', 'Vikram', 'Vishal',
  'Vivek', 'Yash', 'Zaheer', 'Abhishek', 'Akhil', 'Aman', 'Amit', 'Amol', 'Anand', 'Ashwin',
  'Brijesh', 'Chirag', 'Darshan', 'Dinesh', 'Gaurav', 'Hemant', 'Hitesh', 'Jagdish', 'Kartik', 'Lokesh',
  'Mayank', 'Milind', 'Mukesh', 'Nitin', 'Pankaj', 'Parth', 'Prashant', 'Praveen', 'Raghav', 'Rakesh',
  'Ranjit', 'Rishi', 'Ronak', 'Samarth', 'Sarthak', 'Saurabh', 'Shashank', 'Shikhar', 'Shivam', 'Siddhesh',
  'Sourabh', 'Subhash', 'Sumit', 'Sunny', 'Swapnil', 'Tushar', 'Vaibhav', 'Vikas', 'Vipin', 'Yogesh',
]

const femaleFirst = [
  'Aadhya', 'Aaliyah', 'Ananya', 'Anika', 'Anushka', 'Avani', 'Bhavna', 'Deepa', 'Diya', 'Divya',
  'Esha', 'Fatima', 'Gauri', 'Ishita', 'Isha', 'Jhanvi', 'Kavya', 'Khushi', 'Kiara', 'Komal',
  'Krithi', 'Meera', 'Maya', 'Natasha', 'Neha', 'Nisha', 'Pallavi', 'Pooja', 'Prachi', 'Priya',
  'Radhika', 'Riya', 'Roshni', 'Sakshi', 'Sanya', 'Shreya', 'Simran', 'Sneha', 'Sonali', 'Tanvi',
  'Trisha', 'Uma', 'Urvashi', 'Vaishali', 'Vidya', 'Zoya', 'Akanksha', 'Alka', 'Amrita', 'Anjali',
  'Archana', 'Asha', 'Barkha', 'Charu', 'Damini', 'Garima', 'Gunjan', 'Harshita', 'Hema', 'Jyoti',
  'Kajal', 'Kamini', 'Kanika', 'Kiran', 'Kritika', 'Latika', 'Madhuri', 'Malini', 'Mansi', 'Mona',
  'Monika', 'Namrata', 'Nandini', 'Neelam', 'Nidhi', 'Payal', 'Preeti', 'Priyanka', 'Rachna', 'Rakhi',
  'Rashmi', 'Reena', 'Rekha', 'Richa', 'Ritu', 'Rupal', 'Sarita', 'Seema', 'Sheetal', 'Shivani',
  'Shweta', 'Smita', 'Sunita', 'Sushmita', 'Swati', 'Tanya', 'Vandana',
]

const lastNames = [
  'Sharma', 'Patel', 'Rao', 'Kumar', 'Nair', 'Gupta', 'Verma', 'Singh', 'Reddy', 'Mehta',
  'Joshi', 'Das', 'Iyer', 'Roy', 'Bhatia', 'Chopra', 'Saxena', 'Mishra', 'Pandey', 'Sethi',
  'Kulkarni', 'Deshmukh', 'Nambiar', 'Menon', 'Pillai', 'Hegde', 'Agarwal', 'Bansal', 'Goel', 'Jain',
  'Mittal', 'Kapoor', 'Malhotra', 'Khanna', 'Gill', 'Sidhu', 'Grewal', 'Sen', 'Mukherjee', 'Banerjee',
  'Chatterjee', 'Bose', 'Dutta', 'Ghosh', 'Chawla', 'Ahluwalia', 'Bhardwaj', 'Chauhan', 'Dave', 'Dubey',
  'Goswami', 'Jadhav', 'Kadam', 'Mahajan', 'Naidu', 'Pawar', 'Rathore', 'Shinde', 'Solanki', 'Trivedi',
  'Yadav', 'Thakur', 'Bhatt', 'Choudhury', 'Somani', 'Vyas', 'Modi', 'Shah', 'Soni', 'Parekh',
  'Zaveri', 'Dhar', 'Kaul', 'Raina', 'Tikoo', 'Babu', 'Reddiar', 'Chettiar', 'Gounder', 'Mudaliar',
  'Acharya', 'Bhat', 'Kamath', 'Prabhu', 'Shenoy', 'Kamat', 'Pai', 'Kini', 'Shetty', 'Rai',
  'Alva', 'Bhandary', 'Ballal', 'Salian', 'Poojary', 'Kotian', 'Suvarna', 'Bangera', 'Karkera', 'Amin',
]

const CURATED_SEED: DummyPersonRaw[] = [
  {
    name: 'Maya Sharma',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    phone: '+919820000001',
    isPhoneVerified: true,
  },
  {
    name: 'Arjun Patel',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    phone: '+919820000002',
    isPhoneVerified: true,
  },
  {
    name: 'Neha Rao',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    phone: '+919820000003',
    isPhoneVerified: true,
  },
  {
    name: 'Ravi Kumar',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    phone: '+919820000004',
    isPhoneVerified: true,
  },
  {
    name: 'Priya Nair',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    phone: '+919820000005',
    isPhoneVerified: true,
  },
  {
    name: 'Rohan Gupta',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    phone: '+919820000006',
    isPhoneVerified: true,
  },
  {
    name: 'Ananya Verma',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
    phone: '+919820000007',
    isPhoneVerified: true,
  },
  {
    name: 'Vikram Singh',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    phone: '+919820000008',
    isPhoneVerified: true,
  },
  {
    name: 'Sneha Reddy',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    phone: '+919820000009',
    isPhoneVerified: true,
  },
  {
    name: 'Karan Mehta',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    phone: '+919820000010',
    isPhoneVerified: true,
  },
]

function generate1000VerifiedPeople(): DummyPersonRaw[] {
  const people: DummyPersonRaw[] = [...CURATED_SEED]
  const seenNames = new Set<string>(people.map((p) => p.name))
  let maleIdx = 0
  let femaleIdx = 0
  let lastIdx = 0

  for (let i = people.length; i < 1000; i++) {
    const isMale = i % 2 === 0
    let name = ''
    let attempts = 0
    do {
      const first = isMale
        ? maleFirst[(maleIdx++) % maleFirst.length]
        : femaleFirst[(femaleIdx++) % femaleFirst.length]
      const last = lastNames[(lastIdx + attempts) % lastNames.length]
      name = `${first} ${last}`
      attempts++
    } while (seenNames.has(name) && attempts < 100)
    lastIdx++
    seenNames.add(name)

    const gender = isMale ? 'men' : 'women'
    const portraitNum = ((i * 7 + 13) % 99) + 1
    const photo = `https://randomuser.me/api/portraits/${gender}/${portraitNum}.jpg`
    const phoneSuffix = String(i + 1).padStart(6, '0')
    const phone = `+919820${phoneSuffix}`

    people.push({
      name,
      photo,
      phone,
      isPhoneVerified: true,
    })
  }

  return people
}

/**
 * 1,000 Unique Dummy People with Verified E.164 Phone Numbers and Portrait Avatars
 */
export const DUMMY_PEOPLE_RAW: DummyPersonRaw[] = generate1000VerifiedPeople()

/**
 * All 1,000 Suggested Names and Verified Contacts for Autocomplete & Search
 */
export const ALL_SUGGESTED_NAMES: DummyPersonRaw[] = DUMMY_PEOPLE_RAW
