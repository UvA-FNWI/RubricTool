// using this instead of 'xlsx' for production to minimize file size
import { writeFile, utils, read, WorkBook } from '../node_modules/xlsx/xlsx.mini'; 
import { concat, flatMap, chunk, keyBy } from 'lodash';
import axios from 'axios';
// not importing JQuery because it's already in Canvas

const parts = window.location.pathname.split('/');
const start = parts.indexOf('courses') + 1;
const course_id = +parts[start];
const rubric_id = +parts[start + 2];

const download = $(`<a href="#" class="Button button-sidebar-wide"><i aria-hidden="true" class="icon-download"></i> Download rubric</a>`);
$('#right-side').append(download);

const upload = $(`<label style='display: inline' for='uploadRubric'>
<a class="Button button-sidebar-wide">
<i aria-hidden="true" class="icon-upload"></i> Upload rubric
</a>
<input type='file' id='uploadRubric' accept='.xlsx' hidden />
</label>
`);
$('#right-side').append(upload);

const url = `/api/v1/courses/${course_id}/rubrics/${rubric_id}`;
const token = document.cookie.split(';').filter(c => c.indexOf('_csrf_token') != -1)[0].split('=')[1];
axios.defaults.headers.common['x-csrf-token'] = decodeURIComponent(token);

download.on('click', () => {
    axios.get(url).then(resp => saveRubric(resp.data));
});

console.log(token);

document.getElementById('uploadRubric').addEventListener('change', handleUpload);

function handleUpload(this: HTMLInputElement) {
    if (this.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(<ArrayBuffer>e.target.result);
            replaceRubric(read(data, {type: 'array'}));
        }
        reader.readAsArrayBuffer(this.files[0]);
    }
}

function saveRubric(rubric: Rubric) {
    const crits = rubric.data.map(c => concat(
        [c.id, c.description, c.long_description, c.points], 
        flatMap(c.ratings, r => [r.long_description, r.points])
        ));
    const headers = concat(["ID", "Description", "Long description", "Points"], 
        flatMap(rubric.data[0].ratings, r => [r.description, `Points (${r.description})`]));
    const aoa = concat([headers], crits);
    const wb = utils.book_new();
    if (rubric.title.length > 31) { rubric.title = rubric.title.substring(0, 30); }
    utils.book_append_sheet(wb, utils.aoa_to_sheet(aoa), rubric.title);
    writeFile(wb, `rubric_${rubric_id}.xlsx`);
}

function replaceRubric(book: WorkBook) {
    const sheet = book.Sheets[book.SheetNames[0]];
    const aoa = <any[][]>utils.sheet_to_json(sheet, {header: 1});
    const headers = chunk(aoa[0].slice(4), 2).map(r => r[0]);
    const crits: RubricCriterion[] = aoa.slice(1).map(r => {
        const ratings = chunk(r.slice(4), 2).map((c,i) => ({
            description: headers[i],
            long_description: c[0],
            points: +c[1]
        }));
        return {
            id: r[0],
            description: r[1],
            long_description: r[2],
            points: +r[3],
            ratings: keyBy(ratings, r => ratings.indexOf(r))
        };
    });
    const rubric: any = {
        criteria: keyBy(crits, r => crits.indexOf(r))
    };
    axios.put(url, {rubric: rubric, rubric_id: rubric_id, id: rubric_id})
        .then(res => window.location.reload(), res => alert('An error has occurred updating the rubric'));
}

