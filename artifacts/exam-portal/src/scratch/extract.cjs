const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('/Users/jashwanthsingh/Downloads/selfstudys_com_file.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('/Users/jashwanthsingh/emcet-test-portal-mock/artifacts/exam-portal/src/scratch/extracted_full.txt', data.text);
    console.log("Extraction complete");
}).catch(err => {
    console.error(err);
});
