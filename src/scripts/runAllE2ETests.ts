import { spawn } from "child_process";
import path from "path";

interface TestSuite {
  id: string;
  name: string;
  file: string;
  durationMs?: number;
  passed?: boolean;
  error?: string;
}

const testSuites: TestSuite[] = [
  {
    id: "PHASE_0",
    name: "Phase 0: P0 Core Security (JWT, Chat Membership, Auth Limiter)",
    file: "src/scripts/testP0Security.ts",
  },
  {
    id: "PHASE_2",
    name: "Phase 2: Database Hardening (Soft Delete, Report Collection, Indices)",
    file: "src/scripts/testPhase2Hardening.ts",
  },
  {
    id: "PHASE_3",
    name: "Phase 3: Auth Security (Email OTP Reset Password, NoSQL Sanitizer)",
    file: "src/scripts/testPhase3AuthSecurity.ts",
  },
  {
    id: "PHASE_4A",
    name: "Phase 4A: Admin Real APIs & Cursor-based Pagination",
    file: "src/scripts/testPhase4AdminAndCursor.ts",
  },
  {
    id: "PHASE_4B",
    name: "Phase 4B: Redis High-Speed Caching & Auto-Invalidation",
    file: "src/scripts/testPhase4RedisCacheScalability.ts",
  },
];

const runCommand = (command: string, args: string[]): Promise<{ code: number; output: string }> => {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      shell: true,
      cwd: path.resolve(__dirname, "../../"),
      env: { ...process.env },
    });

    let output = "";

    child.stdout?.on("data", (data) => {
      const str = data.toString();
      output += str;
      process.stdout.write(str);
    });

    child.stderr?.on("data", (data) => {
      const str = data.toString();
      output += str;
      process.stderr.write(str);
    });

    child.on("close", (code) => {
      resolve({ code: code ?? 1, output });
    });
  });
};

const runAllTests = async () => {
  console.log("==========================================================================");
  console.log("   SMARTCOOK BACKEND - MASTER AUTOMATED E2E & SECURITY TEST RUNNER        ");
  console.log("==========================================================================");
  console.log(`Đang chuẩn bị chạy ${testSuites.length} bộ kiểm thử tự động toàn diện...\n`);

  const startTime = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;

  for (let i = 0; i < testSuites.length; i++) {
    const suite = testSuites[i];
    console.log(`\n▶ [${i + 1}/${testSuites.length}] Đang chạy: ${suite.name}...`);
    console.log(`  File: ${suite.file}`);
    console.log("--------------------------------------------------------------------------");

    const suiteStart = Date.now();
    const result = await runCommand("npx", ["tsx", suite.file]);
    suite.durationMs = Date.now() - suiteStart;

    if (result.code === 0) {
      suite.passed = true;
      totalPassed++;
      console.log(`\n✔ [PASS] ${suite.name} (${(suite.durationMs / 1000).toFixed(2)}s)`);
    } else {
      suite.passed = false;
      totalFailed++;
      suite.error = `Exit code ${result.code}`;
      console.error(`\n✖ [FAIL] ${suite.name} (${(suite.durationMs / 1000).toFixed(2)}s)`);
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n==========================================================================");
  console.log("                    BẢNG TỔNG KẾT KIỂM THỬ HỆ THỐNG                       ");
  console.log("==========================================================================");
  testSuites.forEach((s, idx) => {
    const status = s.passed ? "✔ PASS" : "✖ FAIL";
    const duration = ((s.durationMs || 0) / 1000).toFixed(2) + "s";
    console.log(` ${idx + 1}. [${status}] ${s.name.padEnd(60)} | ${duration.padStart(8)}`);
  });
  console.log("--------------------------------------------------------------------------");
  console.log(`Tổng thời gian thực thi: ${totalDuration}s`);
  console.log(`Kết quả: ${totalPassed} Passed / ${testSuites.length} Total Suites`);

  if (totalFailed > 0) {
    console.error(`\n❌ CÓ ${totalFailed} BỘ TEST THẤT BẠI! Vui lòng kiểm tra lại logs.`);
    process.exit(1);
  } else {
    console.log("\n🎉 CHÚC MỪNG! TẤT CẢ CÁC BỘ TEST ĐÃ VƯỢT QUA 100% TIÊU CHUẨN PRODUCTION 🎉");
    process.exit(0);
  }
};

runAllTests().catch((err) => {
  console.error("Lỗi ngoại lệ khi chạy Master Test Runner:", err);
  process.exit(1);
});
