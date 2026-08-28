const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "src");
const target = path.join(root, "dist");

function copyDirectory(from, to) {
  fs.mkdirSync(to, { recursive: true });

  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const sourcePath = path.join(from, entry.name);
    const targetPath = path.join(to, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

async function build() {
  const { documents, materializeDocument, readDocument, version, writeDocuments } = await import("./legal.mjs");
  writeDocuments();
  fs.rmSync(target, { recursive: true, force: true });
  copyDirectory(source, target);
  // Published downloads include the same feature descriptions as the HTML pages.
  for (const { slug } of documents) {
    fs.writeFileSync(
      path.join(target, "legal/brew-way", slug, "versions", `${version}.md`),
      materializeDocument(slug, readDocument(slug)),
    );
  }
  // Keep the existing branch-based Pages entry points in sync with the build artifact.
  for (const name of ["assets", "legal", "services"]) {
    copyDirectory(path.join(target, name), path.join(root, name));
  }
  fs.copyFileSync(path.join(target, "index.html"), path.join(root, "index.html"));
  console.log(`Built static site to ${path.relative(root, target)}`);
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
