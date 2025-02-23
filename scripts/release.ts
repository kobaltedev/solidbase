import { execSync } from "node:child_process";

if (!execSync("git --version").includes("git version")) {
    console.error("Git not installed");
    // @ts-ignore
    process.exit(1);
}

// @ts-ignore
const DRY_RUN = !process.env.GITHUB_ACTIONS;

if (DRY_RUN) console.log("DRY RUN");
else console.log("LIVE RUN (GITHUB ACTION)")


const allVersionGitTags = execSync(`git tag -l "v*.*.*"`).toString().trim()
    .split("\n")
    .map(s => s.slice(1))
    .filter(s => s.includes("-") ? s.includes("-next") : true)
    .sort(sortSemver)
    .reverse();

const releasesTags = allVersionGitTags.filter(s => !s.includes("-"));
const previewTags = allVersionGitTags.filter(s => s.includes("-"));

const latestReleaseHash = execSync(`git log -1 v${releasesTags[0]} --pretty=format:%H`).toString().trim();

const rawCommitsSinceLatestRelease = execSync(`git log ${latestReleaseHash}^.. --pretty=format:%s[body]%b[!body]`).toString().trim().split("[!body]\n");

interface CommitData {
    message: string;
    type: "chore" | "feat" | "perf" | "fix" | "unknown";
    breaking: boolean;
}

const commitDatas: CommitData[] = rawCommitsSinceLatestRelease.map(s => {
    const message = s.split("[body]")[0];
    const type = getCommitType(message);

    return {
        message: type === "unknown" ? message.trim() : message.split(":").slice(1).join(":").trim(),
        type,
        breaking: isCommitBreaking(message, s),
    };
})

console.log({commitDatas});

const majorChanges = commitDatas.some(c => c.breaking);
const minorChanges = commitDatas.some(c => c.type === "feat");


const shouldRelease = commitDatas[0].type === "chore" && commitDatas[0].message.match(/^release( \d+\.\d+\.\d+)?/);

let nextVersion;
if (shouldRelease || minorChanges || majorChanges) {
    if (commitDatas[0].message.replace("release ", "").match(/\d+\.\d+\.\d+/)) {
        nextVersion = commitDatas[0].message.replace("release ", "");
    } else {
        nextVersion = incVersion(releasesTags[0], majorChanges, minorChanges);
    }

    console.log(`Changes found, publishing release ${nextVersion}...`, DRY_RUN ? "[DRY RUN]" : "");
} else {
    const latestPreviewVersion = previewTags[0].split("-next.")[0];
    const laterPreviewNumber = Number(previewTags[0].split("-next.")[1]);

    if (latestPreviewVersion === releasesTags[0]) {
        nextVersion = `${latestPreviewVersion}-next.${laterPreviewNumber + 1}`;
    } else {
        nextVersion = `${releasesTags[0]}-next.0`;
    }

    console.log(`No release changes, publishing preview ${nextVersion}...`, DRY_RUN ? "[DRY RUN]" : "");
}














function incVersion(version: string, _major: boolean, _minor: boolean) {
    let major = _major;
    let minor = _minor;

    if (version.startsWith("0.")) {
        minor = major;
        major = false;
    }

    const v = {
        major: Number(version.split(".")[0]) + major,
        minor: Number(version.split(".")[1]) + minor,
        patch: Number(version.split(".")[2]) + 1,
    }

    if (major) {
        return `${v.major}.0.0`;
    }

    if (minor) {
        return `${v.major}.${v.minor}.0`;
    }

    return `${v.major}.${v.minor}.${v.patch}`;
}

function getCommitType(commit: string): CommitData["type"] {
    if (commit.match(/^feat(\(.*\))?!?:/)) return "feat";
    if (commit.match(/^fix(\(.*\))?!?:/)) return "fix";
    if (commit.match(/^perf(\(.*\))?!?:/)) return "perf";
    if (commit.match(/^chore(\(.*\))?!?:/)) return "chore";
    return "unknown";
}

function isCommitBreaking(commit: string, body: string): boolean {
    if (commit.includes("!:")) return true;
    return body.split("\n").slice(-1)[0].startsWith("BREAKING CHANGE:");
}

function sortSemver(a, b) {
    const major = (s) => Number(s.split(".")[0]);
    const minor = (s) => Number(s.split(".")[1]);
    const patch = (s) => Number(s.split(".")[2].split("-")[0]);
    const preview = (s) => {
        const fullPatch = s.split(".")[2];
        if (!fullPatch.includes("-")) return 0;
        return Number(fullPatch.split("-next.")[1]);
    };

    if (major(a) > major(b)) return 1;
    if (major(a) < major(b)) return -1;

    if (minor(a) > minor(b)) return 1;
    if (minor(a) < minor(b)) return -1;

    if (patch(a) > patch(b)) return 1;
    if (patch(a) < patch(b)) return -1;

    if (preview(a) > preview(b)) return 1;
    if (preview(a) < preview(b)) return -1;

    return 0;
}