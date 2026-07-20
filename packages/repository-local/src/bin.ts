#!/usr/bin/env node

import { run, type StricliProcess } from "@stricli/core";

import { application } from "./app.js";

const stricliProcess: StricliProcess = {
  stdout: process.stdout,
  stderr: process.stderr,
  get exitCode() {
    return process.exitCode ?? null;
  },
  set exitCode(value) {
    process.exitCode = value;
  },
};

await run(application, process.argv.slice(2), { process: stricliProcess });
