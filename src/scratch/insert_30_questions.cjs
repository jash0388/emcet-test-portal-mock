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
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const parsedPath = path.join(__dirname, 'parsed_questions.json');
  if (!fs.existsSync(parsedPath)) {
    console.error("parsed_questions.json not found.");
    process.exit(1);
  }

  const allQuestions = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));

  // Take 15 chemistry (first 15) and 15 physics (starts around index 35)
  // Index 35 is sort_order 36 (Physics question 1)
  const chemistryQuestions = allQuestions.slice(0, 15);
  const physicsQuestions = allQuestions.slice(35, 35 + 15);

  const selectedQuestions = [...chemistryQuestions, ...physicsQuestions];

  // Get the exam
  const { data: examData, error: examError } = await supabase
    .from('exams')
    .select('id')
    .eq('title', 'EAMCET Mock Test-1')
    .single();

  if (examError || !examData) {
    console.error("Could not find exam 'EAMCET Mock Test-1':", examError);
    process.exit(1);
  }

  const examId = examData.id;

  // Delete existing questions for this exam
  const { error: deleteError } = await supabase
    .from('exam_questions')
    .delete()
    .eq('exam_id', examId);

  if (deleteError) {
    console.error("Error deleting old questions:", deleteError);
  } else {
    console.log("Deleted old questions.");
  }

  // Insert new questions
  const formattedQuestions = selectedQuestions.map((q, index) => ({
    exam_id: examId,
    question: q.question,
    question_type: q.question_type,
    options: q.options,
    correct_answer: q.correct_answer,
    marks: q.marks,
    sort_order: index + 1
  }));

  const { error: insertError } = await supabase
    .from('exam_questions')
    .insert(formattedQuestions);

  if (insertError) {
    console.error("Error inserting questions:", insertError);
  } else {
    console.log(`Successfully inserted ${formattedQuestions.length} questions (15 Chem, 15 Phys).`);
  }
}

run();
