'use strict';

const fs = require('node:fs');
const path = require('node:path');
const frontMatter = require('hexo-front-matter');

const POSTS_DIR = path.join(process.cwd(), 'source', '_posts');

const TAG_RULES = [
  { tag: 'RISC-V', keywords: ['risc-v', 'riscv', 'rvv', 'vector extension'] },
  { tag: 'TPU', keywords: ['tpu', 'tensor processing unit', 'mxu', 'npu'] },
  { tag: '指令集', keywords: ['isa', '指令集', '扩展指令', 'opcode', 'tablegen', 'csr', 'tcr'] },
  { tag: '微架构', keywords: ['ife', '前端', '微架构', '发射', '流水', 'hazard'] },
  { tag: 'LLVM', keywords: ['llvm', 'tablegen', 'selectiondag', 'globalisel'] },
  { tag: 'QEMU', keywords: ['qemu', '指令级', 'emulator'] },
  { tag: 'CModel', keywords: ['cmodel', 'golden model', 'atomic cmodel'] },
  { tag: '验证', keywords: ['验证', '对拍', 'sanity check', 'palladium', '回归'] },
  { tag: 'LLM', keywords: ['llm', 'flash attention', '大模型'] },
  { tag: '性能优化', keywords: ['吞吐', '性能', '优化', 'latency', 'utilization'] },
  { tag: '架构方法学', keywords: ['ssot', 'single source of truth', 'docs-as-code', 'dita', 'yaml'] }
];

const CATEGORY_RULES = [
  { category: '指令集架构', keywords: ['isa', '扩展指令', 'opcode', 'tablegen', 'csr', 'tcr'] },
  { category: '微架构设计', keywords: ['ife', '微架构', '发射', '流水', 'hazard', 'regfile'] },
  { category: '验证与工具链', keywords: ['qemu', 'cmodel', '验证', '对拍', 'palladium', 'sanity check'] },
  { category: '算子与性能优化', keywords: ['llm', 'flash attention', '算子', '吞吐', '性能', 'bf16', 'fp16'] },
  { category: '架构方法学', keywords: ['ssot', 'yaml', 'docs-as-code', 'dita', '自动化'] }
];

function includesKeyword(text, keyword) {
  return text.includes(String(keyword).toLowerCase());
}

function collectTags(contentText) {
  const tags = TAG_RULES
    .filter((rule) => rule.keywords.some((kw) => includesKeyword(contentText, kw)))
    .map((rule) => rule.tag);
  return tags.length > 0 ? tags : ['芯片架构'];
}

function resolveCategory(contentText) {
  const scored = CATEGORY_RULES.map((rule) => ({
    category: rule.category,
    score: rule.keywords.reduce((acc, kw) => acc + (includesKeyword(contentText, kw) ? 1 : 0), 0)
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0] && scored[0].score > 0 ? [scored[0].category] : ['芯片架构实践'];
}

function updatePostTaxonomy(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = frontMatter.parse(raw);
  const content = `${data.title || ''}\n${data._content || ''}`.toLowerCase();

  data.tags = collectTags(content);
  data.categories = resolveCategory(content);

  const output = `---\n${frontMatter.stringify(data)}`;
  fs.writeFileSync(filePath, output, 'utf8');
}

function run() {
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(POSTS_DIR, name));

  files.forEach(updatePostTaxonomy);
  console.log(`Auto taxonomy updated: ${files.length} posts`);
}

run();
