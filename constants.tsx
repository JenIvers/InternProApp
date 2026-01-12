
import { Competency } from './types';

export const CORE_COMPETENCIES: Competency[] = [
  { id: 'A', category: 'Core Leadership', title: 'Leadership', description: 'General leadership competencies for all Minnesota licenses.' },
  { id: 'A1', category: 'Core Leadership', title: 'Culture of Engagement', description: 'Collaboratively assessing and improving culture of engagement, ethical/equitable practice, and systems perspective.' },
  { id: 'A2', category: 'Core Leadership', title: 'Educational Mission', description: 'Collaboratively developing a shared educational mission for school/district.' },
  { id: 'A3', category: 'Core Leadership', title: 'Decision-making', description: 'Shared leadership and decision-making strategies.' },
  { id: 'A4', category: 'Core Leadership', title: 'External Impacts', description: 'Understand how education is impacted by local, state, and global issues.' },
  { id: 'A5', category: 'Core Leadership', title: 'Strategic Planning', description: 'Formulate strategic plans and goals.' },
  { id: 'B', category: 'Core Leadership', title: 'Organizational Management', description: 'Managing organizational systems, data, and resources.' },
  { id: 'B1', category: 'Core Leadership', title: 'Org Systems', description: 'Understanding structural and cultural dynamics.' },
  { id: 'B2', category: 'Core Leadership', title: 'Data Processes', description: 'Processes for gathering, analyzing, and using data.' },
  { id: 'B5', category: 'Core Leadership', title: 'Budgets', description: 'Develop and manage budgets and accurate fiscal records.' },
  { id: 'C', category: 'Core Leadership', title: 'Equity & Responsive Leadership', description: 'Ensuring fair treatment and understanding of diverse cultures.' },
  { id: 'C5', category: 'Core Leadership', title: 'Bias Identification', description: 'Recognize, identify, and address individual and institutional biases.' },
  { id: 'D', category: 'Core Leadership', title: 'Policy & Law', description: 'Understanding state, federal, and constitutional provisions.' },
  { id: 'E', category: 'Core Leadership', title: 'Political Influence', description: 'Governance models and stakeholder involvement.' },
  { id: 'F', category: 'Core Leadership', title: 'Communication', description: 'Facilitation, conflict resolution, and public speaking.' },
  { id: 'G', category: 'Core Leadership', title: 'Community Relations', description: 'Engagement with the extended community and generating a positive image.' },
  { id: 'H', category: 'Core Leadership', title: 'Curriculum & Assessment', description: 'Coherent systems for student success.' },
  { id: 'I', category: 'Core Leadership', title: 'Human Resources', description: 'Recruiting, selecting, and retaining personnel.' },
  { id: 'J', category: 'Core Leadership', title: 'Values & Ethics', description: 'Role of education in a democratic society.' },
  { id: 'K', category: 'Core Leadership', title: 'Judgment & Analysis', description: 'Problem analysis and reaching logical conclusions.' },
  { id: 'L', category: 'Core Leadership', title: 'Safety & Security', description: 'Policies for safe and secure environments.' }
];

export const PRINCIPAL_COMPETENCIES: Competency[] = [
  { id: 'P_A', category: 'Principal', title: 'Instructional Leadership', description: 'Supporting staff in implementation of standards.' },
  { id: 'P_B', category: 'Principal', title: 'Monitor Student Learning', description: 'Fostering a community of learners.' },
  { id: 'P_C', category: 'Principal', title: 'PK-12 Leadership', description: 'Understanding organizational systems across all levels.' }
];

export const OUTCOME_COMPETENCIES: Competency[] = [
  { id: 'O1', category: 'Outcomes', title: 'License Proficiency', description: 'Display proficiency of MN administrative license competencies.' },
  { id: 'O2', category: 'Outcomes', title: 'Personal Formation', description: 'Practice reflection and sustained personal formation.' },
  { id: 'O3', category: 'Outcomes', title: 'Strategic Thinking', description: 'Apply strategic and collaborative thinking to issues.' },
  { id: 'O4', category: 'Outcomes', title: 'Faith & Ethics', description: 'Integrate faith, values, and ethics in leadership.' },
  { id: 'O5', category: 'Outcomes', title: 'Diversity & Equity', description: 'Demonstrate leadership in areas of diversity, inclusion, and equity.' },
  { id: 'O6', category: 'Outcomes', title: 'Academic Research', description: 'Demonstrate strong academic writing and research abilities.' }
];

export const ALL_COMPETENCIES = [...CORE_COMPETENCIES, ...PRINCIPAL_COMPETENCIES, ...OUTCOME_COMPETENCIES];
