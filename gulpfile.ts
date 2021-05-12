import { task, series, parallel } from 'gulp';
import { buildVideoMap } from './scripts/build_categories';
import { buildChangelog, bundleMDPages } from './scripts/build_views';
import {
  compressFiles,
  releaseLibraryData,
  copyPageData,
  releaseRed33mData,
  createPageDirs,
  generateVersion
} from './scripts/build';







task('build',
  series(
    parallel(createPageDirs, generateVersion()),
    parallel(bundleMDPages, buildVideoMap),
    compressFiles(),
    parallel(copyPageData, releaseLibraryData, releaseRed33mData)
  )
);


task('changelog', series(
  parallel(buildChangelog, generateVersion(true)),
  compressFiles(true)
));

task('genver', generateVersion());

task('test', buildVideoMap);