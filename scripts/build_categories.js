"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseLibraryData = exports.compressLibraryData = exports.createVideoMap = void 0;
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const api_videos_1 = require("../services/api_videos");
const config_json_1 = __importDefault(require("../config.json"));
const gulp_1 = require("gulp");
const gulp_changed_1 = __importDefault(require("gulp-changed"));
const gulp_gzip_1 = __importDefault(require("gulp-gzip"));
const paths = config_json_1.default.paths;
// library/videos/Philosophical reasoning/*
// library/videos/Paranormal Abilities/*
const categories = {
    'AA': 'General Spirituality (Meta-Spirituality)',
    'AB': 'Enlightenment',
    'AC': 'Religious Acceptance',
    'AD': 'Philosophical Reasoning',
    'AE': 'Reincarnation & the Soul',
    'AF': 'Paranormal Abilities',
    'AG': 'PAT (Paranormal Ability Training)',
    'AH': 'Paranormal Entities',
    'AI': 'Psychedelics',
    'AJ': 'Law of Attraction',
    'AK': 'Lifestyle Integration',
    'AL': 'Conspiracies',
};
function getCategoryName(category) {
    const cat = categories[category];
    if (!cat)
        throw Error('Category Not Found');
    return cat;
}
async function createVideoMap(cb) {
    if (!fs_1.existsSync(paths.dist.library))
        fs_1.mkdirSync(paths.dist.library);
    if (!fs_1.existsSync(paths.release.library))
        fs_1.mkdirSync(paths.release.library);
    const rawVideos = await api_videos_1.getVideos({
        starts_with: 'library/videos',
        version: 'draft',
        sort_by: 'content.category:asc',
    });
    const videoMap = {};
    rawVideos.forEach(v => {
        const cat = getCategoryName(v.category);
        delete v.category;
        if (!videoMap[cat])
            videoMap[cat] = [];
        videoMap[cat].push(v);
    });
    await promises_1.writeFile(`${paths.dist.library}/videos.json`, JSON.stringify(videoMap, null, 2));
    cb();
}
exports.createVideoMap = createVideoMap;
function compressLibraryData() {
    return gulp_1.src(`${paths.dist.library}/*.json`)
        .pipe(gulp_changed_1.default(paths.release.library, { extension: `.json.gz` }))
        .pipe(gulp_gzip_1.default({ gzipOptions: { level: 9 } }))
        .pipe(gulp_1.dest(paths.release.library));
}
exports.compressLibraryData = compressLibraryData;
function releaseLibraryData() {
    return gulp_1.src(`${paths.dist.library}/*.json`)
        .pipe(gulp_changed_1.default(paths.release.library))
        .pipe(gulp_1.dest(paths.release.library));
}
exports.releaseLibraryData = releaseLibraryData;
