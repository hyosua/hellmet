import type { Framework } from "./types";

interface FrameworkSignature {
  framework: Framework;
  keywords: string[];
  weight: number; // higher = more specific
}

const SIGNATURES: FrameworkSignature[] = [
  // Full-stack / meta-frameworks — check before their base
  {
    framework: "nextjs",
    keywords: ["from 'next'", 'from "next"', "next/router", "next/navigation", "next/link", "getServerSideProps", "getStaticProps", "NextPage", "next/image"],
    weight: 10,
  },
  {
    framework: "nestjs",
    keywords: ["from '@nestjs/", "@Controller(", "@Get(", "@Post(", "@Module(", "@Injectable(", "@Body(", "@Param("],
    weight: 10,
  },
  // Frontend frameworks
  {
    framework: "react",
    keywords: ["from 'react'", 'from "react"', "import React", "useState(", "useEffect(", "useRef(", "ReactDOM", "jsx", ".tsx", "React."],
    weight: 5,
  },
  {
    framework: "vue",
    keywords: ["from 'vue'", 'from "vue"', "defineComponent(", "Vue.component", "<template>", "v-model", "v-if", "v-for", "ref(", "computed("],
    weight: 5,
  },
  {
    framework: "angular",
    keywords: ["from '@angular/core'", "@Component(", "@NgModule(", "ngOnInit", "ChangeDetectionStrategy", "EventEmitter", "@Input()", "@Output()"],
    weight: 5,
  },
  {
    framework: "svelte",
    keywords: ["from 'svelte'", 'from "svelte"', "<script>", "$:", "on:click", "bind:value", "bind:this", "$store"],
    weight: 5,
  },
  // Backend frameworks
  {
    framework: "express",
    keywords: ["from 'express'", 'require("express")', "require('express')", "app.get(", "app.post(", "app.use(", "app.listen(", "router.get(", "router.post(", "res.json(", "res.send("],
    weight: 5,
  },
  {
    framework: "django",
    keywords: ["from django", "import django", "models.Model", "views.View", "HttpResponse", "render(request", "urlpatterns", "Django"],
    weight: 5,
  },
  {
    framework: "flask",
    keywords: ["from flask", "import Flask", "@app.route", "Flask(__name__", "render_template", "request.form", "jsonify("],
    weight: 5,
  },
  {
    framework: "laravel",
    keywords: ["use Illuminate\\", "Route::get(", "Route::post(", "->middleware(", "Eloquent", "Artisan", "namespace App\\"],
    weight: 5,
  },
];

/**
 * Detects the most likely framework from a code snippet.
 * Returns null if no framework is confidently detected.
 */
export function detectFramework(code: string): Framework | null {
  const lower = code.toLowerCase();
  let best: { framework: Framework; score: number } | null = null;

  for (const sig of SIGNATURES) {
    let score = 0;
    for (const kw of sig.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        score += sig.weight;
      }
    }
    if (score > 0 && (best === null || score > best.score)) {
      best = { framework: sig.framework, score };
    }
  }

  return best ? best.framework : null;
}

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  react: "React",
  nextjs: "Next.js",
  vue: "Vue",
  angular: "Angular",
  svelte: "Svelte",
  express: "Express",
  nestjs: "NestJS",
  django: "Django",
  flask: "Flask",
  laravel: "Laravel",
  generic: "Generic",
};
