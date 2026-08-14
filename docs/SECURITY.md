# Security

## Reporting

Do not publish a suspected vulnerability in an issue before the maintainers can
assess it. Use the private contact channel identified by the project owner or
the organization profile.

## Repository credentials

The publisher accepts a fine-grained GitHub token only through the
`VOX_GITHUB_TOKEN` process environment variable. The token is never written to
the export, command arguments, Git configuration, remote URLs, or the
publication manifest.

Use a token restricted to the `IRONCREED/VOX` repository with repository
Contents read and write permission. Metadata read permission is implicit. Set a
finite expiry and rotate the token after suspected exposure.

## Fail-closed controls

The verifier blocks publication when it finds an unexpected path, a symbolic
link, a forbidden source class, a secret-shaped value, non-English public
documentation, an oversized file, a mismatched digest, a dirty source release,
or an unmanaged non-empty destination repository. Branch updates are
fast-forward only.

Hosted Sites runtime secrets are not required by this source distribution. A
repository write token should not be placed in client-side code or a public
environment variable.
