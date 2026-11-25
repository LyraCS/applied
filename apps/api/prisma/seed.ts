import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client'
import type { JobType, Status } from '../src/generated/prisma/enums'
import { env } from '../src/config/env'
import { hashPassword } from '../src/lib/password'

// Fixed IDs make this seed idempotent: `upsert` finds the same rows on every
// run instead of appending another copy of the demo data.
const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001'
const DEMO_EMAIL = 'demo@applied.example'
const DEMO_PASSWORD = 'demo-password-123'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: env.DIRECT_URL }),
})

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

type SeedApplication = {
  id: string
  company: string
  position: string
  status: Status
  appliedAt: Date | null
  location: string | null
  jobType: JobType | null
  salary: string | null
  portalUrl: string | null
  hiringContact: string | null
  jobDescription: string | null
  qualifications: string | null
  notes: string | null
}

const applications: SeedApplication[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    company: 'Northwind Labs',
    position: 'Frontend Engineer',
    status: 'OFFER',
    appliedAt: daysAgo(14),
    location: 'Remote (EU)',
    jobType: 'FULL_TIME',
    salary: '€68k–€82k',
    portalUrl: 'https://example.com/jobs/northwind-frontend',
    hiringContact: 'maya@northwind.example',
    jobDescription: 'Own the component library and ship customer-facing dashboards.',
    qualifications: 'React, TypeScript, design systems.',
    notes: 'Verbal offer; reviewing equity and start date.',
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    company: 'Acme Corp',
    position: 'Software Engineer',
    status: 'INTERVIEW',
    appliedAt: daysAgo(9),
    location: 'San Francisco, CA (Hybrid)',
    jobType: 'FULL_TIME',
    salary: '$120k–$150k',
    portalUrl: 'https://example.com/jobs/acme-engineer',
    hiringContact: 'talent@acme.example',
    jobDescription: 'Build services behind the applicant portal.',
    qualifications: 'Node.js, PostgreSQL, REST APIs.',
    notes: 'Technical round moved to Friday. Prepare system-design notes.',
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    company: 'Bluebird Health',
    position: 'Full Stack Developer',
    status: 'APPLIED',
    appliedAt: daysAgo(3),
    location: 'Remote (US)',
    jobType: 'CONTRACT',
    salary: '$70–$85/hr',
    portalUrl: null,
    hiringContact: null,
    jobDescription: 'Six-month contract on a patient-facing scheduling tool.',
    qualifications: 'TypeScript, React, Node.js.',
    notes: 'Portfolio link sent with the application.',
  },
  {
    id: '00000000-0000-4000-8000-000000000104',
    company: 'Aurora Design',
    position: 'UI Engineer',
    status: 'APPLIED',
    appliedAt: daysAgo(6),
    location: 'Berlin, Germany',
    jobType: 'FULL_TIME',
    salary: '€55k–€70k',
    portalUrl: 'https://example.com/jobs/aurora-ui',
    hiringContact: null,
    jobDescription: 'Turn Figma prototypes into accessible product interfaces.',
    qualifications: 'React, Tailwind, WCAG basics.',
    notes: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000105',
    company: 'Greenfield Robotics',
    position: 'Graduate Software Engineer',
    status: 'SAVED',
    appliedAt: null,
    location: 'Remote (EU)',
    jobType: 'FULL_TIME',
    salary: null,
    portalUrl: 'https://example.com/jobs/greenfield-graduate',
    hiringContact: null,
    jobDescription: 'Graduate scheme rotating through firmware and web tooling.',
    qualifications: 'CS degree, any modern language.',
    notes: 'Saved from a careers fair. Tailor the CV before applying.',
  },
  {
    id: '00000000-0000-4000-8000-000000000106',
    company: 'Silverline Analytics',
    position: 'Data Engineer',
    status: 'REJECTED',
    appliedAt: daysAgo(32),
    location: 'London, UK',
    jobType: 'FULL_TIME',
    salary: '£50k–£65k',
    portalUrl: null,
    hiringContact: 'jobs@silverline.example',
    jobDescription: 'Build ETL pipelines for the analytics team.',
    qualifications: 'Python, SQL, dbt.',
    notes: 'Rejected after first round; useful feedback on SQL.',
  },
  {
    id: '00000000-0000-4000-8000-000000000107',
    company: 'Orbit Payments',
    position: 'Backend Engineer (Node.js)',
    status: 'INTERVIEW',
    appliedAt: daysAgo(18),
    location: 'Remote',
    jobType: 'FULL_TIME',
    salary: '$105k–$130k',
    portalUrl: 'https://example.com/jobs/orbit-backend',
    hiringContact: 'dev.hiring@orbit.example',
    jobDescription: 'Payment orchestration and ledger services.',
    qualifications: 'Node.js, event-driven systems, Postgres.',
    notes: 'Take-home due next Tuesday.',
  },
  {
    id: '00000000-0000-4000-8000-000000000108',
    company: 'Cedar & Co',
    position: 'Frontend Contractor',
    status: 'SAVED',
    appliedAt: null,
    location: 'Remote',
    jobType: 'CONTRACT',
    salary: null,
    portalUrl: null,
    hiringContact: null,
    jobDescription: null,
    qualifications: null,
    notes: 'Referral from a classmate; follow up next week.',
  },
  {
    id: '00000000-0000-4000-8000-000000000109',
    company: 'Brightpath Education',
    position: 'Junior Developer',
    status: 'APPLIED',
    appliedAt: daysAgo(1),
    location: 'Amsterdam, NL',
    jobType: 'PART_TIME',
    salary: '€28k–€36k pro-rata',
    portalUrl: 'https://example.com/jobs/brightpath-junior',
    hiringContact: null,
    jobDescription: 'Maintain internal tools for a small education team.',
    qualifications: 'One year of web development; React helpful.',
    notes: null,
  },
  {
    id: '00000000-0000-4000-8000-000000000110',
    company: 'Summit Cloud',
    position: 'Platform Engineer',
    status: 'REJECTED',
    appliedAt: daysAgo(45),
    location: 'Remote',
    jobType: 'FULL_TIME',
    salary: '$110k–$140k',
    portalUrl: null,
    hiringContact: null,
    jobDescription: 'Internal developer platform and CI tooling.',
    qualifications: 'Kubernetes, Terraform, Go.',
    notes: 'Applied too early; revisit after a year of experience.',
  },
]

async function main() {
  const passwordHash = await hashPassword(DEMO_PASSWORD)

  // Upsert by email so an existing demo account keeps its own ID. The fixed
  // application IDs below are only used when creating rows.
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: 'Demo User', passwordHash },
    create: { id: DEMO_USER_ID, email: DEMO_EMAIL, name: 'Demo User', passwordHash },
  })

  for (const application of applications) {
    await prisma.application.upsert({
      where: { id: application.id },
      update: { ...application, userId: demoUser.id },
      create: { ...application, userId: demoUser.id },
    })
  }

  console.log(`Seeded demo user ${DEMO_EMAIL} with ${applications.length} applications.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
