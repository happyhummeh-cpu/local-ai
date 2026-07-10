import { spawn } from "child_process";
import http from "http";
import assert from "assert";

console.log("====================================================");
console.log("  QEVRYN v0.1 Desktop Core Integration Test Runner ");
console.log("====================================================");

// We test the already running container server on port 3000 directly.


function makeRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : "";
    const options = {
      hostname: "localhost",
      port: 3000,
      path,
      method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(dataString),
      },
    };

    const req = http.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => {
        responseBody += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(responseBody));
        } catch (e) {
          resolve(responseBody);
        }
      });
    });

    req.on("error", (e) => reject(e));
    if (body) req.write(dataString);
    req.end();
  });
}

// Wait for server to boot
setTimeout(async () => {
  try {
    console.log("\n--- Starting Tests ---");

    // Test 1: Hardware Detection
    console.log("Test 1: GET /api/hardware...");
    const hwRes = await makeRequest("/api/hardware", "GET");
    assert.ok(hwRes.success, "Hardware detection endpoint failed");
    assert.ok(hwRes.hardware.cpu, "No CPU returned in hardware scan");
    assert.ok(hwRes.hardware.accelerationBackends, "No acceleration backends parsed");
    console.log("🟢 Test 1 Passed: Hardware scanned successfully!");

    // Test 2: Local Chat Routing & Execution
    console.log("\nTest 2: POST /api/chat [Local Mode]...");
    const chatRes = await makeRequest("/api/chat", "POST", {
      message: "Explain quantum mechanics in one sentence",
      mode: "local",
    });
    assert.ok(chatRes.success, "Local chat route failed");
    assert.ok(chatRes.response.includes("QEVRYN Core Orchestrator"), "Active orchestrator missing from response");
    console.log("🟢 Test 2 Passed: Chat routed locally in Offline Mode!");

    // Test 3: Sandbox Terminal Executions & Safety Shields
    console.log("\nTest 3: POST /api/agent/run-command (Unsafe Blocker)...");
    const blockedRes = await makeRequest("/api/agent/run-command", "POST", {
      command: "rm -rf /usr/bin",
    });
    assert.strictEqual(blockedRes.blocked, true, "Sandbox failed to block dangerous rm -rf command");
    assert.ok(blockedRes.error.includes("CRITICAL: Destructive action blocked"), "Wrong warning returned");
    console.log("🟢 Test 3 Passed: Cybersecurity gate successfully blocked destructive command!");

    // Test 4: Document Upload & Local RAG Parsing
    console.log("\nTest 4: POST /api/documents/upload...");
    const uploadRes = await makeRequest("/api/documents/upload", "POST", {
      name: "veeomdecoders_manifest.md",
      content: "# Veeomdecoders System Manifest\nThis contains critical architecture specs about QEVRYN.",
      type: "text/markdown",
    });
    assert.ok(uploadRes.success, "RAG document upload failed");
    assert.strictEqual(uploadRes.document.name, "veeomdecoders_manifest.md", "Filename mismatch");
    console.log("🟢 Test 4 Passed: File chunked and indexed successfully!");

    // Test 5: Persistent Local Memory Layer
    console.log("\nTest 5: POST /api/memory (Saving personalized facts)...");
    const memoryRes = await makeRequest("/api/memory", "POST", {
      key: "user_alias",
      value: "Elite Desktop Developer",
      type: "preference",
    });
    assert.ok(memoryRes.success, "Memory creation endpoint failed");
    assert.strictEqual(memoryRes.memory.value, "Elite Desktop Developer", "Memory value did not match");
    console.log("🟢 Test 5 Passed: Local fact persisted to memory!");

    console.log("\n====================================================");
    console.log(" 🎉 ALL 5 QEVRYN INTEGRATION CORE TESTS PASSED SUCCESSFULLY! ");
    console.log("====================================================");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILURE DETECTED:");
    console.error(error);
    process.exit(1);
  }
}, 3000);
