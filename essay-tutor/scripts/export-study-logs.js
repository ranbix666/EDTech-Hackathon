const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const inputDir = path.join(projectRoot, 'study-logs');
const outputDir = path.join(projectRoot, 'study-exports');
const logFiles = [
    'sessions.jsonl',
    'events.jsonl',
    'drafts.jsonl',
    'challenges.jsonl',
    'unlocks.jsonl',
];

function parseJsonLines(filePath) {
    if (!fs.existsSync(filePath)) return [];

    return fs.readFileSync(filePath, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => {
            try {
                return JSON.parse(line);
            } catch (error) {
                throw new Error(`Failed to parse JSON on line ${index + 1} of ${path.basename(filePath)}: ${error.message}`);
            }
        });
}

function flattenRecord(value, prefix = '', target = {}) {
    if (value === null || value === undefined) {
        target[prefix] = '';
        return target;
    }

    if (Array.isArray(value)) {
        target[prefix] = JSON.stringify(value);
        return target;
    }

    if (typeof value !== 'object') {
        target[prefix] = value;
        return target;
    }

    const entries = Object.entries(value);
    if (!entries.length) {
        target[prefix] = '';
        return target;
    }

    entries.forEach(([key, nestedValue]) => {
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
            flattenRecord(nestedValue, nextPrefix, target);
        } else if (Array.isArray(nestedValue)) {
            target[nextPrefix] = JSON.stringify(nestedValue);
        } else {
            target[nextPrefix] = nestedValue ?? '';
        }
    });

    return target;
}

function escapeCsv(value) {
    const normalized = value === null || value === undefined ? '' : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
}

function writeCsv(filePath, rows) {
    if (!rows.length) {
        fs.writeFileSync(filePath, '', 'utf8');
        return;
    }

    const flattenedRows = rows.map((row) => flattenRecord(row));
    const headers = Array.from(
        flattenedRows.reduce((allHeaders, row) => {
            Object.keys(row).forEach((key) => allHeaders.add(key));
            return allHeaders;
        }, new Set())
    ).sort();

    const csvLines = [
        headers.map(escapeCsv).join(','),
        ...flattenedRows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
    ];

    fs.writeFileSync(filePath, csvLines.join('\n'), 'utf8');
}

function ensureOutputDir() {
    fs.mkdirSync(outputDir, { recursive: true });
}

function main() {
    ensureOutputDir();

    if (!fs.existsSync(inputDir)) {
        console.log(`No study logs found at ${inputDir}`);
        return;
    }

    const manifest = [];

    logFiles.forEach((fileName) => {
        const inputPath = path.join(inputDir, fileName);
        const rows = parseJsonLines(inputPath);
        const outputPath = path.join(outputDir, fileName.replace(/\.jsonl$/, '.csv'));

        writeCsv(outputPath, rows);
        manifest.push({
            source_file: fileName,
            output_file: path.basename(outputPath),
            row_count: rows.length,
        });
    });

    fs.writeFileSync(
        path.join(outputDir, 'manifest.json'),
        JSON.stringify({
            exported_at: new Date().toISOString(),
            input_directory: inputDir,
            output_directory: outputDir,
            files: manifest,
        }, null, 2),
        'utf8'
    );

    manifest.forEach((entry) => {
        console.log(`${entry.source_file} -> ${entry.output_file} (${entry.row_count} rows)`);
    });
}

main();
