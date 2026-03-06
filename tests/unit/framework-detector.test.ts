import { detectFramework, FRAMEWORK_LABELS } from "@/core/framework-detector";

describe("detectFramework", () => {
  it("détecte React via import", () => {
    const code = `import React from "react";\nconst App = () => <div>hello</div>;`;
    expect(detectFramework(code)).toBe("react");
  });

  it("détecte Next.js (priorité sur React)", () => {
    const code = `import { useRouter } from "next/router";\nimport React from "react";\nexport default function Page() {}`;
    expect(detectFramework(code)).toBe("nextjs");
  });

  it("détecte Vue via import", () => {
    const code = `import { ref, computed } from "vue";\nconst count = ref(0);`;
    expect(detectFramework(code)).toBe("vue");
  });

  it("détecte Angular via décorateur", () => {
    const code = `import { Component } from "@angular/core";\n@Component({ selector: "app-root" })\nexport class AppComponent {}`;
    expect(detectFramework(code)).toBe("angular");
  });

  it("détecte Svelte via import svelte", () => {
    const code = `import { writable } from "svelte/store";\nimport { onMount } from 'svelte';\n$: doubled = count * 2;`;
    expect(detectFramework(code)).toBe("svelte");
  });

  it("détecte Express via import", () => {
    const code = `const express = require("express");\nconst app = express();\napp.get("/", (req, res) => {});`;
    expect(detectFramework(code)).toBe("express");
  });

  it("détecte NestJS (priorité sur Express)", () => {
    const code = `import { Controller, Get } from "@nestjs/common";\n@Controller("cats")\nexport class CatsController {}`;
    expect(detectFramework(code)).toBe("nestjs");
  });

  it("détecte Django via import Python", () => {
    const code = `from django.db import models\nfrom django.http import HttpResponse`;
    expect(detectFramework(code)).toBe("django");
  });

  it("détecte Flask via import Python", () => {
    const code = `from flask import Flask, render_template\napp = Flask(__name__)`;
    expect(detectFramework(code)).toBe("flask");
  });

  it("détecte Laravel via namespace PHP", () => {
    const code = `<?php\nuse Illuminate\\Http\\Request;\nuse App\\Models\\User;`;
    expect(detectFramework(code)).toBe("laravel");
  });

  it("retourne null pour du code générique", () => {
    const code = `function add(a, b) { return a + b; }`;
    expect(detectFramework(code)).toBeNull();
  });

  it("retourne null pour du code court sans indice", () => {
    const code = `console.log("hello world");`;
    expect(detectFramework(code)).toBeNull();
  });
});

describe("FRAMEWORK_LABELS", () => {
  it("a des labels pour tous les frameworks connus", () => {
    const frameworks = ["react", "nextjs", "vue", "angular", "svelte", "express", "nestjs", "django", "flask", "laravel"] as const;
    for (const f of frameworks) {
      expect(FRAMEWORK_LABELS[f]).toBeDefined();
      expect(typeof FRAMEWORK_LABELS[f]).toBe("string");
    }
  });
});
