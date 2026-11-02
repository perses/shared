# Release process

This page describes how to release the shared libraries. It follows the same process as
[Perses](https://github.com/perses/perses/blob/main/RELEASE.md).

## Release schedule

The version of the shared libraries is synchronized with Perses: each Perses release series (`v<major>.<minor>`) has a
matching release series of the shared libraries. The release schedule and the release shepherds are therefore the ones
defined in the [Perses release schedule](https://github.com/perses/perses/blob/main/RELEASE.md#release-schedule).

## Branch management and versioning strategy

We use [Semantic Versioning](https://semver.org/). All the libraries are versioned and released together.

The current flow is to merge new features and bugfixes into the `main` branch.

Every release series has its own release branch named `release/v<major>.<minor>` (no patch version!). All the
releases of the series (beta, release candidate, final and patch releases) are cut from this branch.

> ⚠️ Do not create a `release/<version>` branch for patch or release candidate releases. They happen in the existing
> `release/v<major>.<minor>` branch.

Note for the release shepherd:

- To simplify the work and the coordination around the release, when you are still cutting beta releases, you can
  simply merge the branch `main` into the release branch.
- When you reach the release candidate stage, stop doing that to avoid introducing new features or enhancements that
  might cause instability and delay the final release. Instead, ask contributors and maintainers to target the release
  branch when opening a PR that fixes a bug.
- Only bugfixes can be accepted when you are cutting release candidates.

## How to cut an individual release

### 1. Create the release branch

This step is only required once per release series, before cutting its first release.

Create the release branch from the latest commit of the `main` branch and push it to GitHub:

```bash
git checkout main
git pull origin main
git checkout -b release/v<major>.<minor>
git push origin release/v<major>.<minor>
```

The first version of a release series is `v<major>.<minor>.0-beta.0`.

### 2. Prepare your release

1. Create a branch based on the release branch `release/v<major>.<minor>`. This branch should use the naming pattern
   `<yourname>/release-v<major>.<minor>.<patch>`.
2. Bump the version of the libraries by running [npm-bump.go](./scripts/npm-bump/npm-bump.go):
   `go run ./scripts/npm-bump <new version>`. For example: `go run ./scripts/npm-bump 1.2.3`.
3. Run `npm install`.
4. [not yet automated] Update the version manually in `plugin-system/src/remote/PluginRuntime.tsx`.
5. Commit these changes, either as a standalone commit ("Prepare release vX.Y.Z") or as part of your changes.
6. Push the branch to GitHub and create a pull request with the release branch `release/v<major>.<minor>` as the base.
7. Once the pull request is approved, merge it into the release branch.

### 3. Create the release

Prerequisites: install the [GitHub CLI](https://github.com/cli/cli#installation) and log in with `gh auth login`.

Pull down the latest updates of the release branch, then run [release.go](./scripts/release/release.go):

```bash
git checkout release/v<major>.<minor>
git pull origin release/v<major>.<minor>
go run ./scripts/release --dry-run # optional, only prints the release that would be created
go run ./scripts/release
```

The script:

- verifies that you are on the release branch matching the version of the root `package.json` and that your local
  branch is in sync with the remote. If your remote pointing to `perses/shared` isn't named `origin`, use the flag
  `-remote <name>`.
- creates the GitHub release and the tag `v<version>` on the latest commit of the release branch. The release notes
  are generated from the git history since the previous tag of the release series (or the previous tag reachable when
  it is the first release of the series). Beta and release candidate versions are marked as pre-releases.

Publishing the GitHub release then triggers the automated release process via GitHub Actions:

- Publishing the npm packages (see the release stage in the [CI](./.github/workflows/ci.yml)). Final and patch
  versions are published with the npm dist-tag `latest`, beta and release candidate versions with the dist-tag
  `prerelease`.
- Publishing the CUE module to the Central Registry (see the [CUE workflow](./.github/workflows/cue.yml)).

Please verify that the GitHub Actions complete successfully. If you realize we need to adjust something in the release
notes, you can edit it directly in the GitHub UI.

### 4. Merge the release branch into `main`

The release branch must not be deleted, so that patch releases can be cut from it.

During the release cycle, especially when cutting release candidates, you will have to merge the release branch into
`main` in order to bring the bugfixes back to `main`.

1. You can simply open a pull request to merge the release branch into `main`. This is only acceptable if there is no
   conflict.
2. In case of conflicts, create another branch based on the release branch, resolve the conflicts, and open a pull
   request from your branch targeting `main`.

When this pull request is approved, merge it into `main` ⚠️ **using the "merge pull request" option, not "squash and
merge"**.

You **MUST NOT** squash the release branch into `main`, otherwise the commits that have been tagged disappear from the
`main` history.

## Patch release

Patch releases are cut from the release branch of the version you want to patch. For example, to patch v0.55, use the
branch `release/v0.55`:

1. Open the pull requests fixing the issues against the release branch.
2. Follow the steps 2 to 4 above.

As the version of the shared libraries is synchronized with Perses, a patch release of Perses usually requires a patch
release of the shared libraries for the same release series.

Note: final and patch versions are published with the npm dist-tag `latest`. Do not cut a patch release of a series once
a newer series has reached its final release, otherwise the dist-tag `latest` would move back to the older version.
