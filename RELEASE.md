# Release process

To release a new version of the libraries, you should:

1. Checkout to a new branch named `release-vX.Y.Z` from main.
2. Bump the version of the libraries running [npm-bump.go](./scripts/npm-bump/npm-bump.go) `go run ./scripts/npm-bump <new version>`. For example: `go run ./scripts/npm-bump 1.2.3`.
3. Commit these changes - as a standalone commit ("Prepare release vX.Y.Z") or as part of your changes.
5. Push the changes (new version(s)) and create a PR.
6. After the PR is merged, checkout to and update the main.
7. Run [release.go](./scripts/release/release.go) `go run ./scripts/release`.

Further actions will then be triggered on GitHub side (see release stage in the [CI](./.github/workflows/ci.yml)).
