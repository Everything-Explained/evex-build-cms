import { readFile, access }  from 'fs/promises';
import { pipe, is, both, forEach }  from "ramda";
import { ISODateString }                from "./global_interfaces";
import { basename as pathBasename, resolve as pathResolve } from 'path';
import { console_colors as cc, lnfo, lwarn } from "./lib/logger";
import { hasSameID, isENOENT, saveAsJSON, setIfInDev, tryCatchAsync, tryCreateDir } from "./utilities";
import { CMSEntry, CMSOptions, StoryblokAPI, StorySortString, StoryVersion, useStoryblok } from './services/storyblok';



type ManifestEntry = {
	id        : number|string   // content.id || id
	title     : string;
	author    : string;
	category ?: string;         // AA, AB, AC...
	summary  ?: string;
	date      : ISODateString;  // content.timestamp || first_published_at || created_at
	hash      : string;
}

type Manifest = ManifestEntry[];


export interface BuildOptions {
  /** CDN Root Slug */
  url           : string;
  starts_with   : string;
  version       : StoryVersion;
  sort_by       : StorySortString;
  /** Path to build manifest */
  buildPath     : string;
  /** Will overwrite default manifest file name. */
  manifestName? : string;
  /** Storyblok API Object or Mock API Object */
  api           : StoryblokAPI;
  /** Callback when an entry has been deleted. */
  onDelete?     : (entry: CMSEntry) => void;
  /** Callback when an entry has been updated. */
  onUpdate?     : (entry: CMSEntry) => void;
  /** Callback when an entry has been Added. */
  onAdd?        : (entry: CMSEntry) => void;
}

export interface BuildOptionsInternal extends BuildOptions {
  /** Set as the default manifest file name. */
  manifestName: string;
}




export async function buildManifest(opts: BuildOptions) {
  const { url, api, starts_with, sort_by, version } = opts;
  opts.buildPath = pathResolve(opts.buildPath);
  opts.manifestName ??= pathBasename(opts.buildPath);

  const cmsOptions: CMSOptions = {
    url, starts_with, sort_by, version,
  };

  const latestEntries  = await useStoryblok(api).getCMSEntries(cmsOptions);
  const oldEntries     = await getManifestEntries(latestEntries, opts as BuildOptionsInternal);
  const detectionFuncs = [
    detectAddedEntries(opts.onAdd),
    detectUpdatedEntries(opts.onUpdate),
    detectDeletedEntries(opts.onDelete),
  ];
  const hasUpdatedEntries =
    detectionFuncs.map(f => f(oldEntries, latestEntries)).includes(true)
  ;
  if (hasUpdatedEntries) {
    await saveAsManifest(opts.buildPath, opts.manifestName)(latestEntries);
  }
}


async function getManifestEntries(latestEntries: CMSEntry[], opts: BuildOptionsInternal) {
  const { buildPath, manifestName} = opts;
  const accessResponse = await tryCatchAsync(access(`${buildPath}/${manifestName}.json`));
  return both(is(Error), isENOENT)(accessResponse)
    ? await initManifest(latestEntries, opts)
    : await readManifestFile(buildPath, manifestName)
  ;
}


function initManifest(entries: CMSEntry[], opts: BuildOptionsInternal) {
  const { buildPath, manifestName } = opts;
  const emptyFunc = (e: CMSEntry) => e;
  return pipe(
    tryCreateDir(opts.buildPath),
    forEach<CMSEntry>(opts.onAdd ?? emptyFunc),
    saveAsManifest(buildPath, manifestName)
  )(entries);
}


async function readManifestFile(path: string, fileName: string) {
  const file = await readFile(`${path}/${fileName}.json`, 'utf-8');
  return JSON.parse(file) as Manifest;
}


function saveAsManifest(path: string, fileName: string) {
  return (entries: CMSEntry[]) =>
    saveAsJSON(path, fileName)(entries.map(toManifestEntry))
  ;
}


export function toManifestEntry(newEntry: CMSEntry) {
  const { id, title, author, date, hash, summary } = newEntry;
  const entry: ManifestEntry = { id, title, author, hash, date, };
  if (summary) entry.summary = summary;
  return entry;
}


function detectAddedEntries(onAddEntries?: (entry: CMSEntry) => void) {
  return (oldEntries: ManifestEntry[], latestEntries: CMSEntry[]) => {
    let hasAdded = false;
    for (const newEntry of latestEntries) {
      if (!oldEntries.find(hasSameID(newEntry))) {
        lnfo('add', `${cc.gy(newEntry.hash)}/${newEntry.title}`);
        onAddEntries && onAddEntries(newEntry);
        hasAdded = true;
        // saveBodyToFile(cmsEntry);
      }
    }
    return hasAdded;
  };
}


function detectDeletedEntries(onDelete?: (oldEntry: CMSEntry) => void) {
  return (oldEntries: ManifestEntry[], latestEntries: CMSEntry[]) => {
    let hasDeleted = false;
    for (const oldEntry of oldEntries) {
      if (!latestEntries.find(hasSameID(oldEntry))) {
        lwarn('omit', `${cc.gy(oldEntry.hash)}/${oldEntry.title}`);
        onDelete && onDelete(oldEntry);
        hasDeleted = true;
        // deleteFile(`${slugify(entry.title)}.mdhtml`);
      }
    }
    return hasDeleted;
  };
}


function detectUpdatedEntries(onUpdate?: (updatedEntry: CMSEntry) => void) {
  return (oldEntries: ManifestEntry[], latestEntries: CMSEntry[]) => {
    let hasUpdated = false;
    for (const latestEntry of latestEntries) {
      const oldEntry = oldEntries.find(hasSameID(latestEntry));
      if (oldEntry && oldEntry.hash != latestEntry.hash) {
        lnfo('upd',
          `${cc.yw('(')}${cc.gy(`${oldEntry.hash} ${cc.yw('=>')} ${latestEntry.hash}`)}`
          +`${cc.yw(')')}/${latestEntry.title}`
        );
        onUpdate && onUpdate(latestEntry);
        hasUpdated = true;
        // saveBodyToFile(story);
      }
    }
    return hasUpdated;
  };
}







export const _tdd_buildManifest = setIfInDev({
  buildManifest,
  getManifestEntries,
  initManifest,
  readManifestFile,
  tryCreateDir,
  saveAsManifest,
  toManifestEntry,
  saveAsJSON,
  detectAddedEntries,
  detectDeletedEntries,
  detectUpdatedEntries,
});










