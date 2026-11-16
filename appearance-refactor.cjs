const fs = require('fs');
const cp = require('child_process');
const ts = require('./front/node_modules/typescript');
const postcss = require('./front/node_modules/postcss');
const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const write = (p, s) => fs.writeFileSync(p, s);
const original = p => cp.execFileSync('git', ['-c', 'safe.directory=C:/Users/wngus/Documents/Study-Board', 'show', 'HEAD:' + p], { encoding: 'utf8', maxBuffer: 8e6 }).replace(/\r\n/g, '\n');
const parse = s => ts.createSourceFile('component.tsx', s, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function pruneImports(s) {
  const ast = parse(s), used = new Set();
  function walk(n) { if (ts.isImportDeclaration(n)) return; if (ts.isIdentifier(n)) used.add(n.text); ts.forEachChild(n, walk); }
  walk(ast);
  const edits = [];
  for (const n of ast.statements) {
    if (!ts.isImportDeclaration(n) || !n.importClause) continue;
    const clause = n.importClause, parts = [];
    if (clause.name && used.has(clause.name.text)) parts.push(clause.name.text);
    if (clause.namedBindings) {
      if (ts.isNamespaceImport(clause.namedBindings)) { if (used.has(clause.namedBindings.name.text)) parts.push(clause.namedBindings.getText(ast)); }
      else { const els = clause.namedBindings.elements.filter(e => used.has(e.name.text)); if (els.length) parts.push('{ ' + els.map(e => e.getText(ast)).join(', ') + ' }'); }
    }
    edits.push([n.getStart(ast), n.end, parts.length ? 'import ' + (clause.isTypeOnly ? 'type ' : '') + parts.join(', ') + ' from ' + n.moduleSpecifier.getText(ast) + ';' : '']);
  }
  for (const [a,b,v] of edits.reverse()) s = s.slice(0,a) + v + s.slice(b);
  return s.replace(/\n{3,}/g, '\n\n');
}
function topNames(body) {
  const ast = parse('function hook() {\n' + body + '\n}');
  const names = [];
  const collect = n => { if (ts.isIdentifier(n)) names.push(n.text); else for (const e of n.elements) if (ts.isBindingElement(e)) collect(e.name); };
  for (const stmt of ast.statements[0].body.statements) if (ts.isVariableStatement(stmt)) for (const d of stmt.declarationList.declarations) collect(d.name);
  return names;
}
function view(header, render, names, name, controller, extra = '') {
  const referenced = names.filter(n => new RegExp('\\b' + n + '\\b').test(render));
  return pruneImports(header + '\nimport type { ' + controller + ' } from "./use' + controller + '";\n' + extra + '\nexport default function ' + name + '(props: ' + controller + ') {\nconst { ' + referenced.join(', ') + ' } = props;\n' + render + '\n}\n');
}
// Share channel data, mutations and form state across both visual presentations.
const channels = 'front/src/app/(noLogin)/channels/';
const current = read(channels + 'ChannelsClient.tsx');
const classic = original(channels + 'ChannelsClient.tsx');
const head = current.slice(0, current.indexOf('interface ChannelsClientProps'));
let body = current.slice(current.indexOf('  const { data: session'), current.indexOf('  if (isLoading &&'));
body = '  const theme = useTheme();\n  const router = useRouter();\n  const handleChannelClick = (slug: string) => router.push(`/channels/${slug}`);\n' + body;
const helpers = current.slice(current.indexOf('interface ChannelsClientProps'), current.indexOf('function ChannelsClient'));
const channelNames = ['initialChannels', 'isDbDisconnected', ...topNames(body)];
write(channels + 'useChannelsController.ts', pruneImports(head + '\nimport { useTheme } from "@mui/material";\nimport { useRouter } from "next/navigation";\n' + helpers.replace('interface ChannelsClientProps', 'export interface ChannelsClientProps') + '\nexport default function useChannelsController({ initialChannels, isDbDisconnected }: ChannelsClientProps) {\n' + body + '\nreturn { ' + channelNames.join(', ') + ' };\n}\nexport type ChannelsController = ReturnType<typeof useChannelsController>;\n'));
const render = s => s.slice(s.indexOf('  return (', s.indexOf('  if (isLoading &&')), s.lastIndexOf('\n  );') + 5);
write(channels + 'ChannelsClassicView.tsx', view(classic.slice(0, classic.indexOf('interface ChannelsClientProps')), render(classic), channelNames, 'ChannelsClassicView', 'ChannelsController'));
write(channels + 'ChannelsOrbitalView.tsx', view(head, render(current), channelNames, 'ChannelsOrbitalView', 'ChannelsController'));
write(channels + 'ChannelsClient.tsx', `"use client";
import dynamic from "next/dynamic";
import Loading from "@/app/components/common/Loading";
import { useAppearanceStore } from "@/app/store/appearanceStore";
import ChannelsClassicView from "./ChannelsClassicView";
import useChannelsController from "./useChannelsController";
import type { ChannelsClientProps } from "./useChannelsController";
const ChannelsOrbitalView = dynamic(() => import("./ChannelsOrbitalView"), { loading: () => <Loading /> });
export default function ChannelsClient(props: ChannelsClientProps) {
  const appearance = useAppearanceStore((state) => state.appearance);
  const controller = useChannelsController(props);
  if (controller.isLoading && !props.initialChannels.length) return <Loading />;
  return appearance === "orbital" ? <ChannelsOrbitalView {...controller} /> : <ChannelsClassicView {...controller} />;
}
`);
// The account/menu handlers are also shared; changing design never duplicates auth effects.
const components = 'front/src/app/components/';
const oldTop = original(components + 'TopBar.tsx');
const newTop = read(components + 'TopBar.tsx');
const topHead = oldTop.slice(0, oldTop.indexOf('export default function'));
const topBody = oldTop.slice(oldTop.indexOf('  const router'), oldTop.indexOf('  return ('));
const topNamesList = topNames(topBody);
write(components + 'useTopBarController.ts', pruneImports(topHead + '\nexport default function useTopBarController() {\n' + topBody + '\nreturn { ' + topNamesList.join(', ') + ' };\n}\nexport type TopBarController = ReturnType<typeof useTopBarController>;\n'));
for (const [name, source, css] of [['Classic', oldTop, 'TopBarClassic.module.css'], ['Orbital', newTop, 'TopBar.module.css']]) {
  const topRender = source.slice(source.indexOf('  return ('), source.lastIndexOf('\n  );') + 5).replace('          {currentUser && (', '          <AppearanceMenuItem onSelect={handleSettingsMenuClose} />\n          {currentUser && (');
  const h = source.slice(0, source.indexOf('export default function')).replace('./style/TopBar.module.css', './style/' + css);
  write(components + 'TopBar' + name + 'View.tsx', view(h, topRender, topNamesList, 'TopBar' + name + 'View', 'TopBarController', 'import AppearanceMenuItem from "./AppearanceMenuItem";'));
}
write(components + 'style/TopBarClassic.module.css', original(components + 'style/TopBar.module.css'));
write(components + 'TopBar.tsx', `"use client";
import dynamic from "next/dynamic";
import { useAppearanceStore } from "../store/appearanceStore";
import TopBarClassicView from "./TopBarClassicView";
import useTopBarController from "./useTopBarController";
const TopBarOrbitalView = dynamic(() => import("./TopBarOrbitalView"));
export default function TopBar() {
  const appearance = useAppearanceStore((state) => state.appearance);
  const controller = useTopBarController();
  return appearance === "orbital" ? <TopBarOrbitalView {...controller} /> : <TopBarClassicView {...controller} />;
}
`);
// Small decorative components have no account or form state to share.
for (const [relative, props] of [['DarkModeToggle', ''], ['common/Advertisement', ''], ['common/ScrollUpButton', ''], ['common/SubscribedChannelsPanel', 'SubscribedChannelsPanelProps']]) {
  const path = components + relative;
  const base = relative.split('/').pop();
  let old = original(path + '.tsx');
  let modern = read(path + '.tsx');
  if (props) old = old.replace('interface ' + props, 'export interface ' + props);
  if (base === 'ScrollUpButton') old = old.replace('window.scrollTo({ top: 0, behavior: "smooth" });', 'window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });');
  write(path + 'Classic.tsx', old);
  write(path + 'Orbital.tsx', modern);
  write(path + '.tsx', `"use client";
import dynamic from "next/dynamic";
import { useAppearanceStore } from "@/app/store/appearanceStore";
import Classic from "./${base}Classic";
${props ? 'import type { ' + props + ' } from "./' + base + 'Classic";' : ''}
const Orbital = dynamic(() => import("./${base}Orbital"));
export default function ${base}(${props ? 'props: ' + props : ''}) {
  const appearance = useAppearanceStore((state) => state.appearance);
  return appearance === "orbital" ? <Orbital ${props ? '{...props}' : ''} /> : <Classic ${props ? '{...props}' : ''} />;
}
`);
}
// The HTML attribute scopes the new CSS; the unselected design cannot leak styles.
function scopedCss(css, modules = false) {
  const root = postcss.parse(css);
  root.walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    const prefix = modules ? ':global(html[data-appearance="orbital"])' : 'html[data-appearance="orbital"]';
    rule.selectors = rule.selectors.map(selector => {
      if (modules) return prefix + ' ' + selector;
      if (selector === ':root') return prefix;
      if (selector.startsWith('html')) return selector.replace(/^html/, prefix);
      if (selector.startsWith('[data-theme=')) return prefix + selector;
      return prefix + ' ' + selector;
    });
    if (!modules && rule.selector.includes('body')) rule.walkDecls(d => { if (['color', 'background'].includes(d.prop)) d.important = true; });
  });
  return root.toString();
}
const globalPath = 'front/src/app/globals.css';
write(globalPath, original(globalPath) + '\n/* Optional orbital appearance */\n' + scopedCss(read(globalPath)) + '\nhtml[data-appearance="orbital"] body { background-attachment: scroll !important; }\n');
const layoutPath = 'front/src/app/layout.module.css';
write(layoutPath, original(layoutPath) + '\n/* Optional orbital layout */\n' + scopedCss(read(layoutPath), true) + '\n:global(html[data-appearance="orbital"]) .main_content { transform: none; backface-visibility: visible; max-width: none; }\n:global(html[data-appearance="orbital"]) .right_section { padding-right: 0; }\n');
write('front/src/app/theme/classicTheme.ts', original('front/src/app/theme/theme.ts'));
// Preserve the pagination correction in both appearances, while restoring the original sidebar.
const navPath = components + 'NavMenuBar.tsx';
const modernNav = read(navPath);
let oldNav = original(navPath);
const containerStart = modernNav.indexOf('  const containerStyles');
const containerEnd = modernNav.indexOf('  const titleStyles', containerStart);
const oldContainerStart = oldNav.indexOf('  const containerStyles');
const oldContainerEnd = oldNav.indexOf('  const titleStyles', oldContainerStart);
const modernContainer = modernNav.slice(containerStart, containerEnd).replace('const containerStyles', 'const orbitalContainerStyles');
oldNav = oldNav.slice(0, oldContainerStart) + modernContainer + oldNav.slice(oldContainerStart, oldContainerEnd).replace('const containerStyles', 'const classicContainerStyles') + '  const containerStyles = isOrbital ? orbitalContainerStyles : classicContainerStyles;\n\n' + oldNav.slice(oldContainerEnd);
oldNav = oldNav.replace('const NavMenuBar: FC = () => {', 'const NavMenuBar: FC = () => {\n  const isOrbital = useAppearanceStore((state) => state.appearance === "orbital");');
oldNav = oldNav.replace('import { FC,', 'import { useAppearanceStore } from "../store/appearanceStore";\nimport { FC,');
const correctionStart = modernNav.indexOf('              mt: 1,', modernNav.indexOf('{/*') >= 0 ? 0 : 0);
const modernPagination = modernNav.slice(modernNav.indexOf('          <Box\n            sx={{\n              display: "flex",\n              justifyContent: "space-between",'), modernNav.indexOf('          <Typography\n            variant="caption"', modernNav.indexOf('              이전 페이지')));
const oldPagStart = oldNav.indexOf('          <Box\n            sx={{\n              display: "flex",\n              justifyContent: "space-between",');
const oldPagEnd = oldNav.indexOf('          <Typography\n            variant="caption"', oldNav.indexOf('              이전 페이지'));
if (oldPagStart < 0 || oldPagEnd < 0 || !modernPagination.includes('whiteSpace')) throw new Error('Pagination boundary missing');
oldNav = oldNav.slice(0, oldPagStart) + modernPagination + oldNav.slice(oldPagEnd);
write(navPath, oldNav);
