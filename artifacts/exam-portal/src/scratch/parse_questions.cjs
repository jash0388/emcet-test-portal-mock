const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, 'raw_questions.txt'), 'utf8');

// Regex to split by "QuestionX" or "Physics \n QuestionX"
const parts = raw.split(/Question\d+/);
// First part is usually empty or intro
parts.shift();

const questions = [];
let sort_order = 1;

parts.forEach((block) => {
    block = block.trim();
    if (!block) return;

    // Remove random "Page X"
    block = block.replace(/Page\s+\d+/g, '').trim();

    // Try to extract components
    // Format:
    // [Question Text]
    // Options:
    // A. ... B. ... C. ... D. ...
    // Answer: [A|B|C|D]
    // Solution:
    // [Solution Text]
    
    const optionsMatch = block.match(/Options:\s*([\s\S]+?)Answer:/i);
    const answerMatch = block.match(/Answer:\s*([A-D])/i);
    const solutionMatch = block.match(/Solution:\s*([\s\S]*)/i);

    if (optionsMatch && answerMatch) {
        let questionText = block.substring(0, optionsMatch.index).trim();
        
        let rawOptions = optionsMatch[1].trim();
        // Parse options (A., B., C., D.)
        const optA = rawOptions.match(/A\.\s*([\s\S]*?)(?=B\.)/i)?.[1]?.trim() || '';
        const optB = rawOptions.match(/B\.\s*([\s\S]*?)(?=C\.)/i)?.[1]?.trim() || '';
        const optC = rawOptions.match(/C\.\s*([\s\S]*?)(?=D\.)/i)?.[1]?.trim() || '';
        const optD = rawOptions.match(/D\.\s*([\s\S]*?)$/i)?.[1]?.trim() || '';
        
        const optionsArray = [optA, optB, optC, optD].filter(o => o.length > 0);

        let correctIdx = answerMatch[1].toUpperCase().charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        let correctAnswer = optionsArray[correctIdx] || '';

        // Clean up question text and options
        // Replace newlines with <br/> to keep formatting
        questionText = questionText.replace(/\n/g, '<br/>');
        const explanation = solutionMatch ? solutionMatch[1].trim().replace(/\n/g, '<br/>') : '';

        // If options parsing failed (e.g., they are on separate lines without A., B., C.), skip or use fallback
        if (optionsArray.length === 4) {
            questions.push({
                question: questionText,
                options: optionsArray,
                correct_answer: correctAnswer,
                question_type: 'mcq',
                marks: 1,
                sort_order: sort_order++
                // explanation: explanation // Omit explanation since DB column is missing
            });
        }
    }
});

fs.writeFileSync(path.join(__dirname, 'parsed_questions.json'), JSON.stringify(questions, null, 2));
console.log(`Successfully parsed ${questions.length} questions.`);
