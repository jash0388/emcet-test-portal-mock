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

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    // 1. Delete the previous exam
    await supabase.from('exams').delete().eq('title', 'EAMCET Mock Test-1');

    // 2. Create Exam
    const { data: exam, error: examError } = await supabase
        .from('exams')
        .insert({
            title: 'EAMCET Mock Test-1',
            description: 'Chemistry Special Mock Test based on EAPCET 2025 Paper',
            duration_minutes: 40,
            max_violations: 5,
            is_active: true
        })
        .select()
        .single();

    if (examError) {
        console.error('Error creating exam:', examError);
        return;
    }

    console.log('Created exam:', exam.id);

    // 3. Add Questions (Removed explanation to match DB schema)
    const questions = [
        {
            exam_id: exam.id,
            question: 'The radius of second orbit of hydrogen atom is $a_0$. The radius of $n$-th orbit for an ion ($x$), $n$ and $x$ are respectively:',
            question_type: 'mcq',
            options: ['4, Be<sup>2+</sup>', '3, Li<sup>2+</sup>', '4, Be<sup>3+</sup>', '2, He<sup>+</sup>'],
            correct_answer: '4, Be<sup>3+</sup>',
            marks: 1,
            sort_order: 1
        },
        {
            exam_id: exam.id,
            question: 'Consider the following sequence of reaction:<br/><br/>2CH<sub>3</sub>Cl + Si &rarr; X &rarr; Y &rarr; Z (Polymerisation)<br/><br/>The repeating structural unit in Z is:<br/><img src="/assets/questions/q15_structure.png" alt="Silicone Structure" className="h-32 object-contain" />',
            question_type: 'mcq',
            options: [
                'CH<sub>3</sub>Si(O<sup>-</sup>)<sub>3</sub>',
                '[(CH<sub>3</sub>)<sub>2</sub>SiO]',
                '[(CH<sub>3</sub>)SiO<sub>2</sub>]',
                '[(CH<sub>3</sub>)<sub>3</sub>SiO<sub>0.5</sub>]'
            ],
            correct_answer: '[(CH<sub>3</sub>)<sub>2</sub>SiO]',
            marks: 1,
            sort_order: 15
        },
        {
            exam_id: exam.id,
            question: 'The correct IUPAC name of the following compound is:<br/><br/><img src="/assets/questions/q18_molecule.png" alt="Chemical Molecule" className="max-w-md my-4 rounded-xl border p-4 bg-white" />',
            question_type: 'mcq',
            options: [
                '5-amino-4-hydroxy-1-bromo-1-cyanopentan-4-ol',
                '1-amino-6-bromo-3-hydroxy-4-oxopentanenitrile',
                '6-amino-2-bromo-5-hydroxy-3-oxohexanenitrile',
                '6-amino-2-bromo-5-hydroxy-3-oxopentanenitrile'
            ],
            correct_answer: '6-amino-2-bromo-5-hydroxy-3-oxohexanenitrile',
            marks: 1,
            sort_order: 18
        }
    ];

    const { error: questionsError } = await supabase
        .from('exam_questions')
        .insert(questions);

    if (questionsError) {
        console.error('Error adding questions:', questionsError);
    } else {
        console.log('Added 3 questions successfully.');
    }
}

run();
