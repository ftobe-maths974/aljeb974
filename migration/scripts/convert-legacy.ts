/**
 * convert-legacy.ts
 *
 * Lit legacy/js/application.coffee, extrait le dictionnaire `game_chapter`
 * (5 chapitres × 20 niveaux), parse chaque chaîne DSL en AST, valide via Zod,
 * écrit migration/levels.json.
 *
 * Lancement : `npm run convert`
 *
 * Stratégie de parsing :
 *  - On NE PARSE PAS le CoffeeScript en général. On exploite la régularité de la
 *    déclaration `game_chapter` (clés numériques, sous-clés `level:` et indices
 *    1..20, champs `lhs/rhs/pioche/reveal/shots` avec litéraux array/nombre).
 *  - Pour chaque niveau, on capture le bloc indenté `N :` jusqu'au prochain
 *    `M :` au même niveau d'indentation, et on extrait chaque champ ligne à ligne.
 *  - Les arrays `["x","-t","b.x/_"]` sont parsés en JSON après normalisation
 *    triviale (CoffeeScript et JSON partagent cette syntaxe d'array de strings).
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import {
  GameSchema,
  LevelSchema,
  parseTerm,
  type Atom,
  type Term,
  type Level,
  type RevealItem,
} from "../../src/lib/engine/dsl.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../");
const LEGACY_COFFEE = path.join(ROOT, "legacy/js/application.coffee");
const OUT_JSON = path.join(ROOT, "migration/levels.json");

// ─── Extraction du dictionnaire game_chapter ────────────────────────────────

interface RawLevel {
  lhs?: string[];
  rhs?: string[];
  pioche?: string[];
  reveal?: string[];
  shots?: number;
}

function loadCoffee(): string {
  return fs.readFileSync(LEGACY_COFFEE, "utf8");
}

/**
 * Capture les blocs `N :` d'un chapitre.
 * Retourne une map numéro de niveau → bloc de texte brut.
 */
function extractRawLevels(source: string): Record<number, Record<number, RawLevel>> {
  // On délimite la zone `game_chapter = ` jusqu'à la ligne de séparation "###..." qui suit.
  const startMatch = source.indexOf("game_chapter =");
  if (startMatch < 0) throw new Error("game_chapter introuvable");
  const endMatch = source.indexOf("############", startMatch);
  if (endMatch < 0) throw new Error("fin de game_chapter introuvable");
  const zone = source.slice(startMatch, endMatch);

  const out: Record<number, Record<number, RawLevel>> = {};

  // Chapitre = ligne `N:` au tout début de ligne (indent 0 ou 1).
  // Niveau = ligne `M :` (avec espaces) sous une ligne `level :`.
  const chapterRe = /^\s*(\d+)\s*:\s*\n\s*level\s*:\s*$/gm;
  const chapterMatches: { num: number; headerStart: number; contentStart: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = chapterRe.exec(zone)) !== null) {
    chapterMatches.push({
      num: parseInt(m[1]!, 10),
      headerStart: m.index,
      contentStart: m.index + m[0].length,
    });
  }

  for (let i = 0; i < chapterMatches.length; i++) {
    const { num: chap, contentStart } = chapterMatches[i]!;
    // Le contenu va jusqu'au DÉBUT du chapitre suivant, pas après son entête.
    const end = i + 1 < chapterMatches.length ? chapterMatches[i + 1]!.headerStart : zone.length;
    const chapterText = zone.slice(contentStart, end);
    out[chap] = extractChapterLevels(chapterText);
  }
  return out;
}

function extractChapterLevels(chapterText: string): Record<number, RawLevel> {
  const out: Record<number, RawLevel> = {};
  // Match chaque entête `   N :` ou `   N:` au début d'une ligne.
  // Important : [ \t]+ et NON \s+ pour ne pas inclure de saut de ligne dans l'indent
  // (sinon les lignes blanches entre niveaux faussent le calcul).
  const levelRe = /^([ \t]+)(\d+)[ \t]*:[ \t]*$/gm;
  const headers: { num: number; indent: number; start: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = levelRe.exec(chapterText)) !== null) {
    headers.push({
      num: parseInt(m[2]!, 10),
      indent: m[1]!.length,
      start: m.index + m[0].length,
    });
  }
  for (let i = 0; i < headers.length; i++) {
    const { num, indent, start } = headers[i]!;
    const end = i + 1 < headers.length ? headers[i + 1]!.start : chapterText.length;
    const block = chapterText.slice(start, end);
    out[num] = extractFields(block, indent);
  }
  return out;
}

function extractFields(block: string, parentIndent: number): RawLevel {
  // Chaque champ : `      lhs : [...]` ou `      shots : 7`
  // On veut une indentation strictement > parentIndent.
  const fieldRe = /^([ \t]+)(lhs|rhs|pioche|reveal|shots)[ \t]*:[ \t]*(.*)$/gm;
  const out: RawLevel = {};
  let m: RegExpExecArray | null;
  while ((m = fieldRe.exec(block)) !== null) {
    const fieldIndent = m[1]!.length;
    if (fieldIndent <= parentIndent) continue;
    const key = m[2] as keyof RawLevel;
    const rawValue = m[3]!.trim();
    if (key === "shots") {
      (out as Record<string, unknown>)[key] = parseInt(rawValue, 10);
    } else {
      // CoffeeScript array of strings : `["a","b"]`. JSON-compatible.
      try {
        (out as Record<string, unknown>)[key] = JSON.parse(rawValue);
      } catch (e) {
        throw new Error(`array malformé pour ${key} = ${rawValue}: ${(e as Error).message}`);
      }
    }
  }
  return out;
}

// ─── Conversion RawLevel → Level (avec parsing des termes) ───────────────────

function rawToLevel(raw: RawLevel, levelId: string): Level {
  if (!raw.lhs) throw new Error(`niveau ${levelId} sans lhs`);
  if (raw.shots === undefined) throw new Error(`niveau ${levelId} sans shots`);

  const parseSide = (arr: string[]): Term[] =>
    arr.map((s, idx) => {
      try {
        return parseTerm(s);
      } catch (e) {
        throw new Error(`${levelId} terme #${idx} "${s}" : ${(e as Error).message}`);
      }
    });

  const out: Level = {
    lhs: parseSide(raw.lhs),
    shots: raw.shots,
  };
  if (raw.rhs) out.rhs = parseSide(raw.rhs);
  if (raw.pioche) out.pioche = parseSide(raw.pioche);
  if (raw.reveal) out.reveal = raw.reveal as RevealItem[];

  return LevelSchema.parse(out);
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  const source = loadCoffee();
  const raw = extractRawLevels(source);

  const chapterNums = Object.keys(raw).map(Number).sort((a, b) => a - b);
  if (chapterNums.length !== 5) {
    console.warn(`⚠️ ${chapterNums.length} chapitres extraits (attendu : 5)`);
  }

  const game = {
    version: "1.0.0-legacy-port",
    chapters: chapterNums.map((c) => {
      const levels = raw[c]!;
      const levelKeys = Object.keys(levels).map(Number).sort((a, b) => a - b);
      const levelsOut: Record<string, Level> = {};
      for (const lv of levelKeys) {
        const id = `${c}-${lv}`;
        levelsOut[lv.toString()] = rawToLevel(levels[lv]!, id);
      }
      return {
        index: c,
        title: `Chapitre ${c}`,
        levels: levelsOut,
      };
    }),
  };

  // Validation Zod globale
  const validated = GameSchema.parse(game);

  fs.writeFileSync(OUT_JSON, JSON.stringify(validated, null, 2) + "\n", "utf8");

  // Récap
  const totalLevels = chapterNums.reduce(
    (acc, c) => acc + Object.keys(raw[c]!).length,
    0,
  );
  console.log(`✅ ${chapterNums.length} chapitres / ${totalLevels} niveaux convertis`);
  console.log(`   → ${path.relative(ROOT, OUT_JSON)}`);

  // Sanity-check : compter les atomes uniques
  const atoms = new Set<string>();
  for (const ch of validated.chapters) {
    for (const lv of Object.values(ch.levels)) {
      const all: Atom[] = [];
      const collect = (terms: Term[]) => {
        for (const t of terms) {
          all.push(...t.numerator, ...(t.denominator ?? []));
        }
      };
      collect(lv.lhs);
      if (lv.rhs) collect(lv.rhs);
      if (lv.pioche) collect(lv.pioche);
      for (const a of all) {
        const k =
          a.kind === "unknown"
            ? "x"
            : a.kind === "literal"
              ? `#${a.value}`
              : a.kind === "hole"
                ? "_"
                : a.letter;
        atoms.add((a.sign === -1 ? "-" : "") + k);
      }
    }
  }
  console.log(`   atomes distincts (avec signe) : ${atoms.size}`);
}

main();
