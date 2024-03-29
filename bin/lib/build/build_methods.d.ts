import { StoryVersion } from "../services/storyblok";
export declare const storyBlokVersion: StoryVersion;
export declare const buildPublicBlog: (buildPath: string) => () => import("./build_manifest").BuildResult;
export declare const buildRed33mBlog: (buildPath: string) => () => import("./build_manifest").BuildResult;
export declare const buildChangelog: (buildPath: string) => () => import("./build_manifest").BuildResult;
export declare const buildPublicLit: (buildPath: string) => () => import("./build_manifest").BuildResult;
export declare const buildRed33mLit: (buildPath: string) => () => import("./build_manifest").BuildResult;
export declare const buildPublicVideos: (buildPath: string) => import("./build_manifest").BuildResult;
export declare const buildRed33mVideos: (buildPath: string) => import("./build_manifest").BuildResult;
export declare const buildRed33mArchive: (buildPath: string) => import("./build_manifest").BuildResult;
export declare const buildHomePage: (path: string) => Promise<boolean>;
