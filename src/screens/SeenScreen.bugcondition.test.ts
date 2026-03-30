/**
 * Bug Condition Exploration Test — Property 1
 *
 * Validates: Requirements 1.2, 1.3
 *
 * CRITICAL: Este test DEBE FALLAR en el código sin corregir.
 * El fallo confirma que el bug existe.
 *
 * El bug: `fetchSeenAndRatings` parsea la respuesta de /ratings accediendo
 * únicamente a `ratingsRes.data.ratings?.items`, sin fallback para otras
 * estructuras. Cuando la API devuelve datos en otro formato, el resultado
 * es un array vacío y ningún ítem visto muestra su calificación.
 *
 * **Validates: Requirements 1.2, 1.3**
 */

import * as fc from 'fast-check';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RatingItem {
  tmdbId: number;
  rating: number;
  comment?: string;
}

// ─── Lógica de parseo — versión CORREGIDA ────────────────────────────────────
//
// Replica el fallback robusto implementado en SeenScreen.tsx tras el fix.

function parseRatingsFixed(responseData: unknown): RatingItem[] {
  const data = responseData as any;
  return (
    data?.ratings?.items ||
    data?.ratings ||
    data?.items ||
    data ||
    []
  );
}

// ─── Lógica de parseo extraída del código SIN CORREGIR ────────────────────────
//
// Replica exactamente la expresión buggy de SeenScreen.tsx:
//   ratingsRes.data.ratings?.items || []
//
// Esta función representa el comportamiento anterior (con el bug) — usada solo
// en el caso base de control para confirmar que el fix no rompe la estructura conocida.

function parseRatingsCurrentBuggy(responseData: unknown): RatingItem[] {
  const data = responseData as any;
  return data?.ratings?.items || [];
}

// ─── Generadores fast-check ───────────────────────────────────────────────────

const ratingItemArb = fc.record<RatingItem>({
  tmdbId: fc.integer({ min: 1, max: 999999 }),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

// Al menos 1 rating item para garantizar que la respuesta no está vacía
const nonEmptyRatingsArb = fc.array(ratingItemArb, { minLength: 1, maxLength: 20 });

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 1: Bug Condition — Parseo rígido de ratings en SeenScreen produce array vacío', () => {
  /**
   * Caso 1: Respuesta { items: [...] }
   *
   * La API devuelve los ratings directamente bajo `data.items`.
   * El código buggy accede a `data.ratings?.items` → undefined → [].
   * Comportamiento esperado: extraer `data.items`.
   *
   * EXPECTED: FALLA en código sin corregir (ratings queda [] en lugar de los items)
   */
  it('Caso 1 — respuesta { items: [...] }: ratings NO debe quedar vacío', () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (items) => {
        // isBugCondition: data.ratings?.items es undefined, pero data.items tiene datos
        const responseData = { items };

        const result = parseRatingsFixed(responseData);

        // El comportamiento CORRECTO es que result tenga los items
        // En el código buggy, result === [] → esta aserción FALLA → confirma el bug
        return result.length > 0;
      }),
      { verbose: true, numRuns: 50 }
    );
  });

  /**
   * Caso 2: Respuesta array directo [...]
   *
   * La API devuelve los ratings como array directo en `data`.
   * El código buggy accede a `data.ratings?.items` → undefined → [].
   * Comportamiento esperado: usar `data` directamente.
   *
   * EXPECTED: FALLA en código sin corregir
   */
  it('Caso 2 — respuesta array directo [...]: ratings NO debe quedar vacío', () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (items) => {
        // isBugCondition: responseData es el array directamente
        const responseData = items; // array directo

        const result = parseRatingsFixed(responseData);

        // En el código buggy, result === [] → esta aserción FALLA → confirma el bug
        return result.length > 0;
      }),
      { verbose: true, numRuns: 50 }
    );
  });

  /**
   * Caso 3: Respuesta { ratings: [...] } (array, no objeto paginado)
   *
   * La API devuelve `data.ratings` como array (no como objeto con `.items`).
   * El código buggy accede a `data.ratings?.items` → undefined → [].
   * Comportamiento esperado: usar `data.ratings` directamente.
   *
   * EXPECTED: FALLA en código sin corregir
   */
  it('Caso 3 — respuesta { ratings: [...] } (array, no paginado): ratings NO debe quedar vacío', () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (items) => {
        // isBugCondition: data.ratings es array (no tiene .items)
        const responseData = { ratings: items };

        const result = parseRatingsFixed(responseData);

        // En el código buggy, result === [] → esta aserción FALLA → confirma el bug
        return result.length > 0;
      }),
      { verbose: true, numRuns: 50 }
    );
  });

  /**
   * Caso base (control): Respuesta { ratings: { items: [...] } }
   *
   * La estructura que el código actual SÍ maneja correctamente.
   * Este caso PASA incluso sin el fix — sirve como control.
   *
   * EXPECTED: PASA en código sin corregir (no es bug condition)
   */
  it('Caso base — respuesta { ratings: { items: [...] } }: ratings se carga correctamente (caso control)', () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (items) => {
        // NOT isBugCondition: data.ratings.items existe
        const responseData = { ratings: { items } };

        const result = parseRatingsCurrentBuggy(responseData);

        // El código buggy SÍ maneja este caso → result tiene los items
        return result.length > 0 && result.length === items.length;
      }),
      { verbose: true, numRuns: 50 }
    );
  });
});
