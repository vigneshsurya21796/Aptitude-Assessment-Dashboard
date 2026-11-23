const { spawn } = require("child_process");
const axios = require("axios");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await axios.get(url);
      if (res.status === 200) return true;
    } catch (e) {
      // Server not ready yet
    }
    await sleep(800);
  }
  return false;
}

async function main() {
  console.log("Starting Next.js production server for testing...");

  const server = spawn("cmd.exe", ["/c", "pnpm start"], {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
  });

  try {
    console.log("Waiting for server to listen on port 3000...");
    const isReady = await waitForServer("http://localhost:3000/api/test/instructions");
    if (!isReady) {
      throw new Error("Server failed to respond within timeout window.");
    }
    console.log("Server is live! Running test suite now...\n");

    // Execute test-flow.js
    const testRunner = spawn("node", ["scratch/test-flow.js"], {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    await new Promise((resolve, reject) => {
      testRunner.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Test runner exited with code ${code}`));
      });
      testRunner.on("error", reject);
    });

    console.log("\nVerification succeeded without errors!");
  } finally {
    console.log("Shutting down test server...");
    spawn("cmd.exe", ["/c", "taskkill /F /IM node.exe /T 2>nul"], { stdio: "ignore" });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
