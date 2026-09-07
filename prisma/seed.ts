import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting CRM database seeding...');

  // Clean existing tables
  await prisma.activity.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const counsellorPassword = await bcrypt.hash('counsellor123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Aris Thorne',
      email: 'admin@college.edu',
      passwordHash: adminPassword,
      role: 'ADMIN',
      department: 'Admissions Directorate',
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya@college.edu',
      passwordHash: counsellorPassword,
      role: 'MEMBER',
      department: 'Engineering Admissions',
    },
  });

  const rahul = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'rahul@college.edu',
      passwordHash: counsellorPassword,
      role: 'MEMBER',
      department: 'Management Admissions',
    },
  });

  const ananya = await prisma.user.create({
    data: {
      name: 'Ananya Iyer',
      email: 'ananya@college.edu',
      passwordHash: counsellorPassword,
      role: 'MEMBER',
      department: 'Design & Tech Admissions',
    },
  });

  console.log('✅ Created 4 Users (1 Admin, 3 Counsellors)');

  const counsellors = [priya, rahul, ananya];

  // Helper date generators
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysAhead = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
  const todayAt = (hours: number) => {
    const t = new Date();
    t.setHours(hours, 0, 0, 0);
    return t;
  };

  // Sample Student Lead pool (45 Leads)
  const seedLeadsData = [
    // --- DUE TODAY FOLLOW-UPS ---
    {
      name: 'Aarav Patel',
      email: 'aarav.patel@gmail.com',
      phone: '+91 98234 11223',
      college: 'Delhi Public School, RK Puram',
      course: 'B.Tech Computer Science',
      gradYear: 2028,
      city: 'Delhi',
      source: 'Website',
      status: 'Follow_up',
      assignedToId: priya.id,
      nextFollowUpDate: todayAt(14),
      notes: 'Interested in AI specialization and campus hostel availability.',
      createdAt: daysAgo(5),
    },
    {
      name: 'Diya Sen',
      email: 'diya.sen@outlook.com',
      phone: '+91 98450 99881',
      college: 'National Public School, Bangalore',
      course: 'MBA (Business Analytics)',
      gradYear: 2026,
      city: 'Bangalore',
      source: 'Education_Fair',
      status: 'Interested',
      assignedToId: rahul.id,
      nextFollowUpDate: todayAt(16),
      notes: 'Met at Bangalore EduExpo. 89 percentile in CAT. Requested placement report.',
      createdAt: daysAgo(7),
    },
    {
      name: 'Rohan Deshmukh',
      email: 'rohan.deshmukh@gmail.com',
      phone: '+91 97654 33221',
      college: 'Fergusson Junior College',
      course: 'B.Des (UI/UX & Product)',
      gradYear: 2028,
      city: 'Pune',
      source: 'Social_Media',
      status: 'Follow_up',
      assignedToId: ananya.id,
      nextFollowUpDate: todayAt(11),
      notes: 'Submitted design portfolio. Discussed scholarship eligibility test.',
      createdAt: daysAgo(4),
    },

    // --- OVERDUE FOLLOW-UPS ---
    {
      name: 'Sneha Kulkarni',
      email: 'sneha.k@yahoo.com',
      phone: '+91 91234 56780',
      college: 'Modern High School',
      course: 'BCA (Cloud Computing)',
      gradYear: 2027,
      city: 'Mumbai',
      source: 'WhatsApp',
      status: 'Contacted',
      assignedToId: priya.id,
      nextFollowUpDate: daysAgo(2),
      notes: 'Asked for fee installment schedule. Needs reminder call.',
      createdAt: daysAgo(10),
    },
    {
      name: 'Vikramaditya Roy',
      email: 'vikram.roy@gmail.com',
      phone: '+91 98311 22334',
      college: 'South Point High School',
      course: 'B.Tech AI & Data Science',
      gradYear: 2028,
      city: 'Kolkata',
      source: 'Website',
      status: 'Contacted',
      assignedToId: rahul.id,
      nextFollowUpDate: daysAgo(1),
      notes: 'Enquired about lab facilities and GPU compute clusters.',
      createdAt: daysAgo(8),
    },
    {
      name: 'Tanvi Nair',
      email: 'tanvi.nair@hotmail.com',
      phone: '+91 94470 12345',
      college: 'Chinmaya Vidyalaya',
      course: 'BBA (Marketing & Finance)',
      gradYear: 2027,
      city: 'Kochi',
      source: 'Email_Campaign',
      status: 'Follow_up',
      assignedToId: ananya.id,
      nextFollowUpDate: daysAgo(3),
      notes: 'Parent wants virtual campus walkthrough.',
      createdAt: daysAgo(15),
    },

    // --- UPCOMING FOLLOW-UPS ---
    {
      name: 'Kabir Mehta',
      email: 'kabir.mehta@gmail.com',
      phone: '+91 98200 44556',
      college: 'Cathedral & John Connon School',
      course: 'B.Tech Computer Science',
      gradYear: 2028,
      city: 'Mumbai',
      source: 'Referral',
      status: 'Interested',
      assignedToId: priya.id,
      nextFollowUpDate: daysAhead(2),
      notes: 'Referred by alumni Rahul M. Highly motivated for coding clubs.',
      createdAt: daysAgo(3),
    },
    {
      name: 'Ananya Guha',
      email: 'ananya.guha@gmail.com',
      phone: '+91 98111 88990',
      college: 'Step By Step School',
      course: 'B.Des (UI/UX & Product)',
      gradYear: 2028,
      city: 'Noida',
      source: 'Walk_in',
      status: 'Interested',
      assignedToId: ananya.id,
      nextFollowUpDate: daysAhead(4),
      notes: 'Visited admissions block on Saturday with parents. Impressed by studio.',
      createdAt: daysAgo(2),
    },
    {
      name: 'Harsh Vardhan',
      email: 'harsh.v@gmail.com',
      phone: '+91 99887 66554',
      college: 'St. Xavier’s Senior Sec',
      course: 'MBA (HR & Operations)',
      gradYear: 2026,
      city: 'Jaipur',
      source: 'Website',
      status: 'Contacted',
      assignedToId: rahul.id,
      nextFollowUpDate: daysAhead(3),
      notes: 'Working professional looking for weekend/executive transition options.',
      createdAt: daysAgo(6),
    },

    // --- CONVERTED / ENROLLED LEADS ---
    {
      name: 'Siddharth Menon',
      email: 'sid.menon@gmail.com',
      phone: '+91 98711 00223',
      college: 'The Mother’s International',
      course: 'B.Tech Computer Science',
      gradYear: 2028,
      city: 'Delhi',
      source: 'Website',
      status: 'Converted',
      assignedToId: priya.id,
      nextFollowUpDate: null,
      notes: 'Admission confirmed! Seat booking fee received. Roll number generated.',
      createdAt: daysAgo(25),
    },
    {
      name: 'Kavya Singhania',
      email: 'kavya.s@gmail.com',
      phone: '+91 98300 77112',
      college: 'La Martiniere for Girls',
      course: 'MBA (Business Analytics)',
      gradYear: 2026,
      city: 'Kolkata',
      source: 'Referral',
      status: 'Converted',
      assignedToId: rahul.id,
      nextFollowUpDate: null,
      notes: 'Enrolled in MBA Analytics Batch 2026. Documents verified.',
      createdAt: daysAgo(20),
    },
    {
      name: 'Ishan Joshi',
      email: 'ishan.joshi@gmail.com',
      phone: '+91 94220 55443',
      college: 'Symbiosis Junior College',
      course: 'B.Des (UI/UX & Product)',
      gradYear: 2028,
      city: 'Pune',
      source: 'Social_Media',
      status: 'Converted',
      assignedToId: ananya.id,
      nextFollowUpDate: null,
      notes: 'Merit scholarship awarded (25%). Registration complete.',
      createdAt: daysAgo(18),
    },
    {
      name: 'Meera Nambiar',
      email: 'meera.nambiar@gmail.com',
      phone: '+91 98460 33221',
      college: 'Bhavan’s Vidya Mandir',
      course: 'BCA (Cloud Computing)',
      gradYear: 2027,
      city: 'Kochi',
      source: 'WhatsApp',
      status: 'Converted',
      assignedToId: priya.id,
      nextFollowUpDate: null,
      notes: 'Fee payment receipt verified by accounts desk.',
      createdAt: daysAgo(30),
    },

    // --- NEW LEADS (UNTOUCHED / FRESH) ---
    {
      name: 'Aditya Reddy',
      email: 'aditya.reddy@gmail.com',
      phone: '+91 98490 11223',
      college: 'Hyderabad Public School',
      course: 'B.Tech AI & Data Science',
      gradYear: 2028,
      city: 'Hyderabad',
      source: 'Website',
      status: 'New',
      assignedToId: priya.id,
      nextFollowUpDate: daysAhead(1),
      notes: 'Inquired about cutoff ranks and direct admission eligibility.',
      createdAt: daysAgo(1),
    },
    {
      name: 'Riya Sen Sharma',
      email: 'riya.sensharma@gmail.com',
      phone: '+91 98745 66112',
      college: 'Loreto House',
      course: 'BBA (Marketing & Finance)',
      gradYear: 2027,
      city: 'Kolkata',
      source: 'Instagram_Ad',
      sourceOriginal: 'Social_Media',
      status: 'New',
      assignedToId: rahul.id,
      nextFollowUpDate: daysAhead(1),
      notes: 'Downloaded college brochure from Instagram campaign.',
      createdAt: daysAgo(1),
    },
    {
      name: 'Yashwardhan Chauhan',
      email: 'yash.chauhan@gmail.com',
      phone: '+91 99100 22334',
      college: 'Amity International School',
      course: 'B.Tech Mechanical Engg',
      gradYear: 2028,
      city: 'Noida',
      source: 'Education_Fair',
      status: 'New',
      assignedToId: null,
      nextFollowUpDate: daysAhead(2),
      notes: 'Unassigned lead from Sunday career fair booth.',
      createdAt: daysAgo(1),
    },

    // --- LOST / REJECTED LEADS ---
    {
      name: 'Manish Aggarwal',
      email: 'manish.ag@gmail.com',
      phone: '+91 98100 55441',
      college: 'Bal Bharati Public School',
      course: 'B.Tech Computer Science',
      gradYear: 2028,
      city: 'Delhi',
      source: 'Website',
      status: 'Lost',
      assignedToId: priya.id,
      nextFollowUpDate: null,
      notes: 'Joined government NIT through JEE Main rank. Not interested.',
      createdAt: daysAgo(22),
    },
    {
      name: 'Pooja Hegde',
      email: 'pooja.hegde@gmail.com',
      phone: '+91 98860 77889',
      college: 'Mount Carmel College',
      course: 'MBA (Business Analytics)',
      gradYear: 2026,
      city: 'Bangalore',
      source: 'Walk_in',
      status: 'Lost',
      assignedToId: rahul.id,
      nextFollowUpDate: null,
      notes: 'Fee structure outside budget; opted for state university.',
      createdAt: daysAgo(19),
    },

    // --- ADDITIONAL BATCH LEADS ---
    {
      name: 'Arjun Kapoor',
      email: 'arjun.k@gmail.com',
      phone: '+91 98201 99887',
      college: 'Bombay Scottish',
      course: 'B.Tech Computer Science',
      gradYear: 2028,
      city: 'Mumbai',
      source: 'WhatsApp',
      status: 'Interested',
      assignedToId: priya.id,
      nextFollowUpDate: daysAhead(3),
      notes: 'Wants hostel room allocation confirmation.',
      createdAt: daysAgo(12),
    },
    {
      name: 'Divya Prakash',
      email: 'divya.prakash@gmail.com',
      phone: '+91 97410 44332',
      college: 'Bishop Cotton Boys',
      course: 'B.Tech Electronics & Comm',
      gradYear: 2028,
      city: 'Bangalore',
      source: 'Website',
      status: 'Contacted',
      assignedToId: priya.id,
      nextFollowUpDate: daysAhead(4),
      notes: 'Called for curriculum details of ECE program.',
      createdAt: daysAgo(11),
    },
    {
      name: 'Shreya Goswami',
      email: 'shreya.g@gmail.com',
      phone: '+91 98305 11229',
      college: 'Calcutta Girls High School',
      course: 'B.Des (UI/UX & Product)',
      gradYear: 2028,
      city: 'Kolkata',
      source: 'Social_Media',
      status: 'Interested',
      assignedToId: ananya.id,
      nextFollowUpDate: daysAhead(2),
      notes: 'Attended webinar on Product Design careers.',
      createdAt: daysAgo(9),
    },
    {
      name: 'Nikhil Rathi',
      email: 'nikhil.rathi@gmail.com',
      phone: '+91 98180 66554',
      college: 'Ryan International',
      course: 'MBA (Business Analytics)',
      gradYear: 2026,
      city: 'Gurgaon',
      source: 'Email_Campaign',
      status: 'Follow_up',
      assignedToId: rahul.id,
      nextFollowUpDate: todayAt(15),
      notes: 'Follow-up regarding GMAT score submission.',
      createdAt: daysAgo(6),
    },
    {
      name: 'Payal Somani',
      email: 'payal.somani@gmail.com',
      phone: '+91 98290 88776',
      college: 'Mahaveer School',
      course: 'BBA (Marketing & Finance)',
      gradYear: 2027,
      city: 'Jaipur',
      source: 'Referral',
      status: 'Contacted',
      assignedToId: rahul.id,
      nextFollowUpDate: daysAhead(5),
      notes: 'Family friend of Trustee. Requested expedited review.',
      createdAt: daysAgo(14),
    },
    {
      name: 'Gaurav Tewari',
      email: 'gaurav.tewari@gmail.com',
      phone: '+91 94150 11998',
      college: 'City Montessori School',
      course: 'MCA (Full Stack & Cloud)',
      gradYear: 2026,
      city: 'Lucknow',
      source: 'Website',
      status: 'Follow_up',
      assignedToId: priya.id,
      nextFollowUpDate: daysAhead(1),
      notes: 'Completed BCA from Lucknow Univ. Inquiring on placement packages.',
      createdAt: daysAgo(16),
    },
    {
      name: 'Akanksha Chawla',
      email: 'akanksha.c@gmail.com',
      phone: '+91 98730 22446',
      college: 'DPS Vasant Kunj',
      course: 'B.Tech AI & Data Science',
      gradYear: 2028,
      city: 'Delhi',
      source: 'Education_Fair',
      status: 'Interested',
      assignedToId: priya.id,
      nextFollowUpDate: daysAhead(3),
      notes: 'High academic scorer (94% in CBSE).',
      createdAt: daysAgo(13),
    },
    {
      name: 'Kunal Singhal',
      email: 'kunal.s@gmail.com',
      phone: '+91 99990 12340',
      college: 'Springdales School',
      course: 'B.Tech Computer Science',
      gradYear: 2028,
      city: 'Delhi',
      source: 'Website',
      status: 'Converted',
      assignedToId: priya.id,
      nextFollowUpDate: null,
      notes: 'Seat booked under Early Bird scholarship.',
      createdAt: daysAgo(35),
    },
    {
      name: 'Priyanka Ghosh',
      email: 'priyanka.ghosh@gmail.com',
      phone: '+91 98319 77884',
      college: 'Mahadevi Birla World Academy',
      course: 'MBA (HR & Operations)',
      gradYear: 2026,
      city: 'Kolkata',
      source: 'Walk_in',
      status: 'Contacted',
      assignedToId: rahul.id,
      nextFollowUpDate: daysAhead(2),
      notes: 'Inquired about corporate tie-ups and summer internship stipends.',
      createdAt: daysAgo(8),
    },
    {
      name: 'Tarun Bhatia',
      email: 'tarun.bhatia@gmail.com',
      phone: '+91 98118 99001',
      college: 'Modern School, Barakhamba',
      course: 'B.Des (UI/UX & Product)',
      gradYear: 2028,
      city: 'Delhi',
      source: 'Website',
      status: 'New',
      assignedToId: ananya.id,
      nextFollowUpDate: daysAhead(1),
      notes: 'Submitted contact form from website banner.',
      createdAt: daysAgo(2),
    },
    {
      name: 'Simran Walia',
      email: 'simran.walia@gmail.com',
      phone: '+91 98765 11002',
      college: 'Sacred Heart Senior Sec',
      course: 'BBA (Marketing & Finance)',
      gradYear: 2027,
      city: 'Chandigarh',
      source: 'WhatsApp',
      status: 'Interested',
      assignedToId: rahul.id,
      nextFollowUpDate: daysAhead(3),
      notes: 'Discussed exchange semester opportunities with foreign partner university.',
      createdAt: daysAgo(7),
    },
    {
      name: 'Mohit Rao',
      email: 'mohit.rao@gmail.com',
      phone: '+91 98455 77661',
      college: 'St. Joseph’s Indian High',
      course: 'B.Tech Mechanical Engg',
      gradYear: 2028,
      city: 'Bangalore',
      source: 'Referral',
      status: 'Contacted',
      assignedToId: priya.id,
      nextFollowUpDate: daysAhead(4),
      notes: 'Interested in Formula Student club and EV motorsports lab.',
      createdAt: daysAgo(17),
    },
  ];

  console.log(`⏳ Seeding ${seedLeadsData.length} leads with activity history...`);

  for (const item of seedLeadsData) {
    const lead = await prisma.lead.create({
      data: {
        name: item.name,
        email: item.email,
        phone: item.phone,
        college: item.college,
        course: item.course,
        gradYear: item.gradYear,
        city: item.city,
        source: item.source,
        status: item.status,
        assignedToId: item.assignedToId,
        nextFollowUpDate: item.nextFollowUpDate,
        notes: item.notes,
        createdAt: item.createdAt,
        updatedAt: item.createdAt,
      },
    });

    const counsellorId = item.assignedToId || priya.id;

    // Create realistic activity log history
    await prisma.activity.create({
      data: {
        leadId: lead.id,
        type: 'Follow_up',
        date: item.createdAt,
        notes: `Initial lead registered via ${item.source.replace(/_/g, ' ')}. ${item.notes}`,
        nextAction: item.nextFollowUpDate ? 'Follow-up call scheduled' : null,
        createdById: counsellorId,
      },
    });

    if (item.status !== 'New') {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: item.source === 'WhatsApp' ? 'WhatsApp' : 'Call',
          date: new Date(item.createdAt.getTime() + 1000 * 60 * 60 * 24),
          notes: `Connected with student over ${item.source === 'WhatsApp' ? 'WhatsApp' : 'Phone Call'}. Discussed syllabus, eligibility, and scholarship tests.`,
          nextAction: item.status === 'Converted' ? 'Enrollment fee paid' : 'Send application link',
          createdById: counsellorId,
        },
      });
    }

    if (item.status === 'Converted') {
      await prisma.activity.create({
        data: {
          leadId: lead.id,
          type: 'Meeting',
          date: new Date(item.createdAt.getTime() + 1000 * 60 * 60 * 48),
          notes: 'Campus visit and document verification completed. Official admission granted!',
          nextAction: 'Welcome kit and orientation schedule dispatched.',
          createdById: counsellorId,
        },
      });
    }
  }

  console.log('✅ CRM Database Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
