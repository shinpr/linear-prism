#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const MANIFEST_FILE = ".linear-prism-manifest.json";
const COPY_MAP = [
  { src: "skills", dest: ".agents/skills" },
  { src: ".codex/agents", dest: ".codex/agents" },
];
const MCP_CONFIG_FILE = ".codex/config.toml";
const MCP_SECTION = `[mcp_servers.linear]
url = "https://mcp.linear.app/mcp"
`;

function main(argv = process.argv, cwd = process.cwd()) {
  const command = argv[2];
  const targetDir = cwd;
  const sourceDir = path.resolve(__dirname, "..");

  function getVersion() {
    try {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(sourceDir, "package.json"), "utf8")
      );
      return pkg.version;
    } catch (e) {
      console.error(`Error reading package.json: ${e.message}`);
      process.exit(2);
    }
  }

  function fileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  function copyDirRecursive(src, dest) {
    let copied = 0;
    if (!fs.existsSync(src)) return copied;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copied += copyDirRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
        copied++;
      }
    }
    return copied;
  }

  function collectFiles(dir, base) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(base, entry.name);
      if (entry.isDirectory()) {
        files.push(...collectFiles(fullPath, relPath));
      } else {
        files.push(relPath);
      }
    }
    return files;
  }

  function readManifest() {
    const manifestPath = path.join(targetDir, MANIFEST_FILE);
    if (!fs.existsSync(manifestPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (e) {
      console.error(`Error: ${MANIFEST_FILE} is corrupt: ${e.message}`);
      console.error("Delete the file and run 'install' again, or fix it manually.");
      process.exit(2);
    }
  }

  function writeManifest(fileHashes) {
    const manifestPath = path.join(targetDir, MANIFEST_FILE);
    const manifest = {
      version: getVersion(),
      installedAt: new Date().toISOString(),
      files: fileHashes,
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }

  function ensureMcpConfig() {
    const configPath = path.join(targetDir, MCP_CONFIG_FILE);
    fs.mkdirSync(path.dirname(configPath), { recursive: true });

    if (!fs.existsSync(configPath)) {
      fs.writeFileSync(configPath, MCP_SECTION);
      console.log("  .codex/config.toml — created with Linear MCP");
      return;
    }

    const content = fs.readFileSync(configPath, "utf8");
    if (content.includes("[mcp_servers.linear]")) {
      console.log("  .codex/config.toml — Linear MCP already configured");
      return;
    }

    fs.appendFileSync(configPath, "\n" + MCP_SECTION);
    console.log("  .codex/config.toml — Linear MCP appended");
  }

  function install() {
    const manifest = readManifest();
    if (manifest) {
      console.log(
        `linear-prism v${manifest.version} is already installed. Use 'update' to upgrade.`
      );
      process.exit(1);
    }

    const version = getVersion();
    console.log(`Installing linear-prism v${version}...\n`);

    const fileHashes = {};
    let totalCopied = 0;

    for (const { src, dest } of COPY_MAP) {
      const srcFull = path.join(sourceDir, src);
      const destFull = path.join(targetDir, dest);
      const copied = copyDirRecursive(srcFull, destFull);
      totalCopied += copied;
      for (const relPath of collectFiles(destFull, dest)) {
        fileHashes[relPath] = fileHash(path.join(targetDir, relPath));
      }
      if (copied > 0) console.log(`  ${src}/ → ${dest}/ — ${copied} files`);
    }

    ensureMcpConfig();
    writeManifest(fileHashes);
    console.log(`\nDone. ${totalCopied} files installed.`);
  }

  function update(dryRun) {
    const manifest = readManifest();
    if (!manifest) {
      console.log("linear-prism is not installed. Run 'install' first.");
      process.exit(1);
    }

    const installedHashes = Array.isArray(manifest.files)
      ? Object.fromEntries(manifest.files.map(f => [f, null]))
      : manifest.files;

    const currentVersion = manifest.version;
    const newVersion = getVersion();
    console.log(
      `${dryRun ? "[DRY RUN] " : ""}Updating linear-prism v${currentVersion} → v${newVersion}\n`
    );

    let updated = 0;
    let added = 0;
    let skipped = 0;
    let preserved = 0;
    const preservedFiles = new Set();

    for (const { src, dest } of COPY_MAP) {
      const srcFull = path.join(sourceDir, src);
      if (!fs.existsSync(srcFull)) continue;
      const sourceFiles = collectFiles(srcFull, "");
      for (const fileRel of sourceFiles) {
        const srcFile = path.join(srcFull, fileRel);
        const destRelPath = path.join(dest, fileRel);
        const destFile = path.join(targetDir, destRelPath);

        if (!fs.existsSync(destFile)) {
          if (dryRun) console.log(`  + ${destRelPath} (new)`);
          else {
            fs.mkdirSync(path.dirname(destFile), { recursive: true });
            fs.copyFileSync(srcFile, destFile);
          }
          added++;
          continue;
        }

        const srcContent = fs.readFileSync(srcFile);
        const destContent = fs.readFileSync(destFile);

        if (srcContent.equals(destContent)) { skipped++; continue; }

        const storedHash = installedHashes[destRelPath];
        if (storedHash) {
          const currentHash = crypto.createHash("sha256").update(destContent).digest("hex");
          if (currentHash !== storedHash) {
            console.log(`  ~ ${destRelPath} (modified locally, skipping)`);
            preservedFiles.add(destRelPath);
            preserved++;
            continue;
          }
        }

        if (dryRun) console.log(`  * ${destRelPath} (updated)`);
        else fs.copyFileSync(srcFile, destFile);
        updated++;
      }
    }

    if (!dryRun) {
      ensureMcpConfig();
      const newHashes = {};
      for (const { dest } of COPY_MAP) {
        for (const relPath of collectFiles(path.join(targetDir, dest), dest)) {
          if (preservedFiles.has(relPath) && installedHashes[relPath]) {
            newHashes[relPath] = installedHashes[relPath];
          } else {
            newHashes[relPath] = fileHash(path.join(targetDir, relPath));
          }
        }
      }
      writeManifest(newHashes);
    }

    const parts = [`${added} added`, `${updated} updated`, `${skipped} unchanged`];
    if (preserved > 0) parts.push(`${preserved} preserved (local changes)`);
    console.log(`\n${dryRun ? "[DRY RUN] " : ""}${parts.join(", ")}.`);
  }

  function status() {
    const manifest = readManifest();
    if (!manifest) {
      console.log("linear-prism is not installed.");
      return;
    }
    const fileCount = Object.keys(manifest.files).length;
    console.log(`Version:   ${manifest.version}`);
    console.log(`Installed: ${manifest.installedAt}`);
    console.log(`Files:     ${fileCount} managed`);
  }

  function showHelp() {
    console.log(`
linear-prism — Task decomposition for Linear

Usage:
  npx linear-prism install              Install skills, agents, and MCP config
  npx linear-prism update               Update managed files
  npx linear-prism update --dry-run     Preview changes without applying
  npx linear-prism status               Show installation info
  npx linear-prism --version            Show version
  npx linear-prism --help               Show this help
`);
  }

  switch (command) {
    case "install": install(); break;
    case "update": update(argv.includes("--dry-run")); break;
    case "status": status(); break;
    case "--version": case "-v": console.log(getVersion()); break;
    case "--help": case "-h": case undefined: showHelp(); break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

main();
module.exports = { main };
