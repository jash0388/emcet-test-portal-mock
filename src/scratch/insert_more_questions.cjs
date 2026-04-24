const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
    }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_SERVICE_ROLE_KEY'] || env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const questions = [
  {
    question: "Which one of the following complex ions is diamagnetic in nature?",
    question_type: "mcq",
    options: ["[CoF₆]³⁻", "[Co(Ox)₃]³⁻", "[Mn(CN)₆]³⁻", "[Fe(CN)₆]³⁻"],
    correct_answer: "[Co(Ox)₃]³⁻",
    marks: 1,
    sort_order: 31
  },
  {
    question: "Polymer X is an example of polyester and Y is an example of polyamide. X and Y are respectively:",
    question_type: "mcq",
    options: ["novolac, terylene", "dacron, nylon 6,6", "nylon 6, terylene", "teflon, terylene"],
    correct_answer: "dacron, nylon 6,6",
    marks: 1,
    sort_order: 32
  },
  {
    question: "Which amino acid is not correctly matched with its R group?",
    question_type: "mcq",
    options: [
      "R = -CH₂ - C₆H₄ - OH(p) - (Tyrosine)",
      "R = -CH₂ - SH - (Cysteine)",
      "R = -CH₂ - CH₂ - S - CH₃ - (Serine)",
      "R = -CH₂ - CONH₂ - (Asparagine)"
    ],
    correct_answer: "R = -CH₂ - CH₂ - S - CH₃ - (Serine)",
    marks: 1,
    sort_order: 33
  },
  {
    question: "Assertion (A): Aspirin is useful in the prevention of heart attacks. \nReason (R): Aspirin acts as an anti-blood clotting agent.",
    question_type: "mcq",
    options: [
      "Both A and R are correct and R is the correct explanation of A.",
      "A is correct and R is not correct.",
      "Both A and R are correct and R is not the correct explanation of A.",
      "A is incorrect and R is correct."
    ],
    correct_answer: "Both A and R are correct and R is the correct explanation of A.",
    marks: 1,
    sort_order: 34
  },
  {
    question: "Chlorobenzene when subjected to Fittig reaction gives a compound 'X'. The sum of σ and π bonds in X is:",
    question_type: "mcq",
    options: ["30", "28", "18", "29"],
    correct_answer: "29",
    marks: 1,
    sort_order: 35
  },
  {
    question: "The major product formed in the reaction of 2-bromopentane with alcoholic KOH is:",
    question_type: "mcq",
    options: ["pent-1-ene", "trans-pent-2-ene", "cis-pent-2-ene", "pentan-2-ol"],
    correct_answer: "trans-pent-2-ene",
    marks: 1,
    sort_order: 36
  },
  {
    question: "Which of the following is most reactive towards nucleophilic substitution reaction?",
    question_type: "mcq",
    options: ["Chlorobenzene", "2,4-Dinitrochlorobenzene", "p-Nitrochlorobenzene", "2,4,6-Trinitrochlorobenzene"],
    correct_answer: "2,4,6-Trinitrochlorobenzene",
    marks: 1,
    sort_order: 37
  },
  {
    question: "The product formed when phenol reacts with bromine water is:",
    question_type: "mcq",
    options: ["o-Bromophenol", "p-Bromophenol", "2,4,6-Tribromophenol", "m-Bromophenol"],
    correct_answer: "2,4,6-Tribromophenol",
    marks: 1,
    sort_order: 38
  },
  {
    question: "Which of the following will not undergo Aldol condensation?",
    question_type: "mcq",
    options: ["Acetaldehyde", "Propanaldehyde", "Benzaldehyde", "Acetone"],
    correct_answer: "Benzaldehyde",
    marks: 1,
    sort_order: 39
  },
  {
    question: "The reagent used in Clemmensen reduction is:",
    question_type: "mcq",
    options: ["Zn-Hg / conc. HCl", "NH₂NH₂ / KOH in ethylene glycol", "LiAlH₄", "NaBH₄"],
    correct_answer: "Zn-Hg / conc. HCl",
    marks: 1,
    sort_order: 40
  },
  {
    question: "Which of the following is the strongest base in aqueous solution?",
    question_type: "mcq",
    options: ["Methylamine", "Dimethylamine", "Trimethylamine", "Ammonia"],
    correct_answer: "Dimethylamine",
    marks: 1,
    sort_order: 41
  },
  {
    question: "Vitamin B₁₂ contains which metal ion?",
    question_type: "mcq",
    options: ["Fe²⁺", "Co³⁺", "Zn²⁺", "Mg²⁺"],
    correct_answer: "Co³⁺",
    marks: 1,
    sort_order: 42
  },
  {
    question: "The monomer of Natural Rubber is:",
    question_type: "mcq",
    options: ["Neoprene", "Isoprene", "Chloroprene", "Butadiene"],
    correct_answer: "Isoprene",
    marks: 1,
    sort_order: 43
  },
  {
    question: "Which of the following is an artificial sweetener?",
    question_type: "mcq",
    options: ["Saccharin", "Aspartame", "Alitame", "All of these"],
    correct_answer: "All of these",
    marks: 1,
    sort_order: 44
  },
  {
    question: "The linkage present in proteins is:",
    question_type: "mcq",
    options: ["Glycosidic linkage", "Peptide linkage", "Ester linkage", "Phosphodiester linkage"],
    correct_answer: "Peptide linkage",
    marks: 1,
    sort_order: 45
  }
];

async function insertQuestions() {
  const { data: examData } = await supabase
    .from('exams')
    .select('id')
    .eq('title', 'EAMCET Mock Test-1')
    .single();
  
  if (!examData) {
    console.error('Exam not found');
    return;
  }
  const examId = examData.id;

  for (const q of questions) {
    const { error } = await supabase
      .from('exam_questions')
      .insert({ ...q, exam_id: examId });
    
    if (error) {
      console.error('Error inserting question:', error);
    } else {
      console.log('Inserted:', q.question.substring(0, 30) + '...');
    }
  }
}

insertQuestions();
