/** Filter out non-major version updates.
  @param {string} packageName               The name of the dependency.
  @param {string} currentVersion            Current version declaration (may be range).
  @param {SemVer[]} currentVersionSemver    Current version declaration in semantic versioning format (may be range).
  @param {string} upgradedVersion           Upgraded version.
  @param {SemVer} upgradedVersionSemver     Upgraded version in semantic versioning format.
  @returns {boolean}                        Return true if the upgrade should be kept, otherwise it will be ignored.
*/
filterResults: (packageName, { currentVersion, currentVersionSemver, upgradedVersion, upgradedVersionSemver }) => {
  const currentMajorVersion = currentVersionSemver?.[0]?.major
  const upgradedMajorVersion = upgradedVersionSemver?.major
  if (currentMajorVersion && upgradedMajorVersion) {
    return currentMajorVersion < upgradedMajorVersion
  }
  return true
}

/** Upgrade major version zero to the latest patch version, and everything else to latest minor version.
  @param dependencyName The name of the dependency.
  @param parsedVersion A parsed Semver object from semver-utils.
    (See https://git.coolaj86.com/coolaj86/semver-utils.js#semverutils-parse-semverstring)
  @returns One of the valid target values (specified in the table above).
*/
target: (dependencyName, [{ semver, version, operator, major, minor, patch, release, build }]) => {
  if (major === '0') return 'patch'
  return 'minor'
}
