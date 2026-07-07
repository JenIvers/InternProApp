/**
 * Static reference data from the Bethel Principal Internship Guide.
 *
 * EDITABLE REFERENCE DATA — these lists mirror the Guide's suggested
 * internship activities and the internship process deliverables. Edit titles,
 * descriptions, or add/remove entries to match the current edition of the
 * Guide. Ids are stable keys referenced by AppState.checklists — do not
 * change an id once entries have been checked off against it.
 *
 * Pure data module: no React, no Firebase imports.
 */

export interface SuggestedActivity {
  id: string;
  title: string;
  description: string;
}

export interface Deliverable {
  id: string;
  title: string;
  description: string;
}

/** ~20 suggested internship activities from the Guide. */
export const SUGGESTED_ACTIVITIES: SuggestedActivity[] = [
  {
    id: 'sa-mentor-shadow',
    title: 'Shadow the mentor principal',
    description: 'Spend full days shadowing the principal to observe the scope and rhythm of the role.',
  },
  {
    id: 'sa-budget',
    title: 'Participate in budget development',
    description: 'Work with the principal/business office on building or revising the school budget.',
  },
  {
    id: 'sa-master-schedule',
    title: 'Assist with the master schedule',
    description: 'Participate in building or revising the master schedule (courses, sections, staffing).',
  },
  {
    id: 'sa-discipline',
    title: 'Handle student discipline',
    description: 'Take part in student discipline investigations, conferences, and due-process procedures.',
  },
  {
    id: 'sa-iep-504',
    title: 'Attend IEP/504 meetings',
    description: 'Serve as the administrative designee or observer in special education and 504 meetings.',
  },
  {
    id: 'sa-observation',
    title: 'Observe and supervise staff',
    description: 'Conduct classroom walkthroughs/observations and participate in the teacher evaluation cycle.',
  },
  {
    id: 'sa-pd-leadership',
    title: 'Lead professional development',
    description: 'Plan and deliver a professional development session for staff.',
  },
  {
    id: 'sa-school-board',
    title: 'Attend a school board meeting',
    description: 'Attend (and where possible present at) a school board or district leadership meeting.',
  },
  {
    id: 'sa-family-engagement',
    title: 'Lead community/family engagement',
    description: 'Plan or lead a family or community engagement event (conferences, open house, outreach).',
  },
  {
    id: 'sa-crisis-planning',
    title: 'Review crisis/safety planning',
    description: 'Review or update the school crisis plan; participate in drills and safety committee work.',
  },
  {
    id: 'sa-data-improvement',
    title: 'Lead data-driven improvement',
    description: 'Analyze achievement/behavior data and contribute to the school improvement plan.',
  },
  {
    id: 'sa-hiring',
    title: 'Participate in hiring/interviews',
    description: 'Screen applications, sit on interview committees, and participate in hiring decisions.',
  },
  {
    id: 'sa-plc-facilitation',
    title: 'Facilitate PLC/team meetings',
    description: 'Lead a professional learning community, grade-level, or department team meeting.',
  },
  {
    id: 'sa-curriculum-review',
    title: 'Participate in curriculum review',
    description: 'Join curriculum adoption/alignment work or an instructional materials review.',
  },
  {
    id: 'sa-attendance-mtss',
    title: 'Work with attendance/MTSS teams',
    description: 'Participate in attendance intervention, MTSS/RTI, or student support team processes.',
  },
  {
    id: 'sa-supervision-duty',
    title: 'Supervise school events and duties',
    description: 'Provide administrative supervision at arrival/dismissal, lunch, athletics, and evening events.',
  },
  {
    id: 'sa-district-meetings',
    title: 'Attend district administrative meetings',
    description: 'Attend principal/admin cabinet meetings to see district-level decision making.',
  },
  {
    id: 'sa-staff-communication',
    title: 'Lead staff communication',
    description: 'Write staff bulletins/newsletters or lead a staff meeting segment.',
  },
  {
    id: 'sa-policy-legal',
    title: 'Study policy and school law application',
    description: 'Review district policies and observe how legal requirements (FERPA, mandatory reporting, etc.) are applied.',
  },
  {
    id: 'sa-equity-initiative',
    title: 'Contribute to an equity initiative',
    description: 'Participate in equity, inclusion, or achievement-gap work at the school or district level.',
  },
  {
    id: 'sa-facilities-operations',
    title: 'Review facilities and operations',
    description: 'Work with operations staff on facilities, transportation, food service, or emergency operations.',
  },
];

/** Internship process deliverables (non-log requirements). */
export const DELIVERABLES: Deliverable[] = [
  {
    id: 'del-proposal',
    title: 'Signed internship proposal',
    description: 'Internship proposal completed and signed by the candidate, mentor, and university supervisor.',
  },
  {
    id: 'del-agreement',
    title: 'Signed internship agreement',
    description: 'Formal internship agreement signed by all parties and on file with the university.',
  },
  {
    id: 'del-benchmark',
    title: 'Mid-internship benchmark',
    description: 'Mid-internship benchmark/progress review completed with the mentor and university supervisor.',
  },
  {
    id: 'del-reflection-paper',
    title: 'Final reflection paper',
    description: 'Culminating reflection paper on internship learning and leadership growth.',
  },
  {
    id: 'del-mentor-eval',
    title: 'Mentor evaluation',
    description: "Mentor principal's final evaluation of the candidate submitted to the university.",
  },
  {
    id: 'del-activities-log',
    title: 'Final Internship Activities Log',
    description: 'Completed activities log (Date, Activity, Competency, Location, Hours, Level) with totals, submitted for review.',
  },
  {
    id: 'del-meetings-log',
    title: 'Scheduled Meetings Log',
    description: 'Log of scheduled mentor meetings (Date, Competency, Reflection) submitted for review.',
  },
];
