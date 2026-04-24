const fs = require("fs");
const path = require("path");

const target = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo-updates",
  "android",
  "build.gradle"
);

const ndkBlock = `android {
  if (rootProject.hasProperty("ndkPath")) {
    ndkPath rootProject.ext.ndkPath
  }
  if (rootProject.hasProperty("ndkVersion")) {
    ndkVersion rootProject.ext.ndkVersion
  }

`;

if (!fs.existsSync(target)) {
  console.log(`[fix-expo-updates-ndk] Skipped, file not found: ${target}`);
  process.exit(0);
}

const original = fs.readFileSync(target, "utf8");

if (original.includes('if (rootProject.hasProperty("ndkVersion")) {')) {
  console.log("[fix-expo-updates-ndk] expo-updates already patched");
  process.exit(0);
}

if (!original.includes("android {\n")) {
  throw new Error("[fix-expo-updates-ndk] Could not find android block in expo-updates build.gradle");
}

const updated = original.replace("android {\n", ndkBlock);
fs.writeFileSync(target, updated);
console.log("[fix-expo-updates-ndk] Patched expo-updates to use the root NDK version");
