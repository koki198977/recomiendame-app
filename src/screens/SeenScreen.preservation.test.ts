/**
 * Preservation Tests — Property 2
 *
 * Validates: Requirements 3.1, 3.4, 3.5
 *
 * EXPECTED OUTCOME: Tests PASAN en el código SIN CORREGIR.
 * Confirman el comportamiento base a preservar tras el fix.
 *
 * Metodología observation-first:
 * Observamos el comportamiento actual con la estructura de respuesta conocida
 * { ratings: { items: [...] } } — la única que el código actual maneja correctamente.
 *
 * Para cualquier array aleatorio de RatingItem en estructura { ratings: { items: [...] } },
 * el resultado de fetchSeenAndRatings debe ser idéntico antes y después del fix.
 *
 * **Validates: Requirements 3.1, 3.4, 3.5**
 */

import * as fc from 'fast-check';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface RatingItem {
  tmdbId: number;
  rating: number;
  comment?: string;
}

interface SeenItem {
  tmdbId: number;
  alreadyRated?: boolean;
}

// ─── Lógica extraída del código SIN CORREGIR ──────────────────────────────────
//
// Replica exactamente las expresiones de SeenScreen.tsx sin modificar.

/**
 * Parseo actual (sin corregir): acceso rígido a ratings?.items
 * Usado en fetchSeenAndRatings para construir ratingMap y setRatings.
 */
function parseRatingsOriginal(responseData: unknown): RatingItem[] {
  const data = responseData as any;
  return data?.ratings?.items || [];
}

/**
 * Construcción del ratingMap — replica exactamente el .reduce de SeenScreen.tsx:
 *   (ratingsRes.data.ratings?.items || []).reduce((acc, r) => { acc[r.tmdbId] = r; ... }, {})
 */
function buildRatingMap(ratingsData: RatingItem[]): Record<number, RatingItem> {
  return ratingsData.reduce((acc: Record<number, RatingItem>, r: RatingItem) => {
    acc[r.tmdbId] = r;
    return acc;
  }, {});
}

/**
 * Enriquecimiento de seen items con alreadyRated — replica el .map de SeenScreen.tsx:
 *   seenRes.data.items.map(item => ({ ...item, alreadyRated: !!ratingMap[item.tmdbId] }))
 */
function enrichWithAlreadyRated(
  seenItems: SeenItem[],
  ratingMap: Record<number, RatingItem>
): SeenItem[] {
  return seenItems.map(item => ({
    ...item,
    alreadyRated: !!ratingMap[item.tmdbId],
  }));
}

/**
 * handleOpenRatingModal — replica la lógica de pre-carga del modal en SeenScreen.tsx:
 *   const existing = Array.isArray(ratings) ? ratings.find(r => r.tmdbId === tmdbId) : null;
 *   if (existing) { setRatingValue(existing.rating); setComment(existing.comment || ''); }
 */
function preloadRatingModal(
  ratings: RatingItem[],
  tmdbId: number
): { ratingValue: number; comment: string } {
  const existing = Array.isArray(ratings) ? ratings.find(r => r.tmdbId === tmdbId) : null;
  if (existing) {
    return { ratingValue: existing.rating, comment: existing.comment || '' };
  }
  return { ratingValue: 0, comment: '' };
}

/**
 * handleDeleteRating — replica el filtrado local de SeenScreen.tsx:
 *   setRatings(prev => prev.filter(r => r.tmdbId !== ratingItem.tmdbId))
 */
function filterRatingsAfterDelete(ratings: RatingItem[], deletedTmdbId: number): RatingItem[] {
  return ratings.filter(r => r.tmdbId !== deletedTmdbId);
}

// ─── Generadores fast-check ───────────────────────────────────────────────────

const ratingItemArb = fc.record<RatingItem>({
  tmdbId: fc.integer({ min: 1, max: 999999 }),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
});

// Al menos 1 rating item
const nonEmptyRatingsArb = fc.array(ratingItemArb, { minLength: 1, maxLength: 20 });

// Array de seen items con tmdbIds que pueden o no coincidir con ratings
const seenItemsArb = (ratingItems: RatingItem[]) =>
  fc.array(
    fc.record<SeenItem>({
      tmdbId: fc.oneof(
        // Algunos tmdbIds que coinciden con ratings (para probar alreadyRated = true)
        fc.constantFrom(...ratingItems.map(r => r.tmdbId)),
        // Algunos tmdbIds que no coinciden (para probar alreadyRated = false)
        fc.integer({ min: 1000000, max: 9999999 })
      ),
    }),
    { minLength: 1, maxLength: 10 }
  );

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 2: Preservation — Comportamiento inalterado para estructura { ratings: { items: [...] } }', () => {
  /**
   * Preservation 1: fetchSeenAndRatings extrae correctamente el array de ratings
   *
   * Con respuesta { ratings: { items: [...] } }, parseRatingsOriginal devuelve
   * exactamente el array de items. Este es el comportamiento a preservar.
   *
   * EXPECTED: PASA en código sin corregir (NOT isBugCondition)
   */
  it('Preservation 1 — fetchSeenAndRatings extrae el array de ratings de { ratings: { items: [...] } }', () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (items) => {
        // NOT isBugCondition: data.ratings.items existe
        const responseData = { ratings: { items } };

        const result = parseRatingsOriginal(responseData);

        // El array extraído debe ser idéntico al original
        return (
          result.length === items.length &&
          result.every((r, i) =>
            r.tmdbId === items[i].tmdbId &&
            r.rating === items[i].rating &&
            r.comment === items[i].comment
          )
        );
      }),
      { verbose: true, numRuns: 100 }
    );
  });

  /**
   * Preservation 2: ratingMap se construye con tmdbId → RatingItem para todos los ítems
   *
   * Para cualquier array de RatingItem, buildRatingMap debe producir un mapa
   * donde cada tmdbId apunta al RatingItem correspondiente.
   *
   * EXPECTED: PASA en código sin corregir
   */
  it('Preservation 2 — ratingMap se construye con tmdbId → RatingItem para todos los ítems', () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (items) => {
        // Asegurar tmdbIds únicos para evitar colisiones en el mapa
        const uniqueItems = Array.from(
          new Map(items.map(r => [r.tmdbId, r])).values()
        );

        const ratingMap = buildRatingMap(uniqueItems);

        // Cada item debe estar en el mapa bajo su tmdbId
        return uniqueItems.every(r =>
          ratingMap[r.tmdbId] !== undefined &&
          ratingMap[r.tmdbId].tmdbId === r.tmdbId &&
          ratingMap[r.tmdbId].rating === r.rating
        );
      }),
      { verbose: true, numRuns: 100 }
    );
  });

  /**
   * Preservation 3: alreadyRated se asigna correctamente en cada ítem visto
   *
   * Para cualquier combinación de seen items y ratings, alreadyRated debe ser
   * true si y solo si el tmdbId del seen item está en el ratingMap.
   *
   * EXPECTED: PASA en código sin corregir
   */
  it('Preservation 3 — alreadyRated se asigna correctamente en cada ítem visto', () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (ratingItems) => {
        const uniqueRatings = Array.from(
          new Map(ratingItems.map(r => [r.tmdbId, r])).values()
        );

        const ratingMap = buildRatingMap(uniqueRatings);
        const ratedTmdbIds = new Set(uniqueRatings.map(r => r.tmdbId));

        // Crear seen items: mitad con tmdbIds de ratings, mitad sin
        const seenWithRating: SeenItem[] = uniqueRatings.map(r => ({ tmdbId: r.tmdbId }));
        const seenWithoutRating: SeenItem[] = [{ tmdbId: 9999999 }, { tmdbId: 8888888 }];
        const allSeen = [...seenWithRating, ...seenWithoutRating];

        const enriched = enrichWithAlreadyRated(allSeen, ratingMap);

        // Los items con tmdbId en ratings deben tener alreadyRated = true
        const ratedCorrect = enriched
          .filter(item => ratedTmdbIds.has(item.tmdbId))
          .every(item => item.alreadyRated === true);

        // Los items sin tmdbId en ratings deben tener alreadyRated = false
        const unratedCorrect = enriched
          .filter(item => !ratedTmdbIds.has(item.tmdbId))
          .every(item => item.alreadyRated === false);

        return ratedCorrect && unratedCorrect;
      }),
      { verbose: true, numRuns: 100 }
    );
  });

  /**
   * Preservation 4: handleOpenRatingModal pre-carga ratingValue y comment del rating existente
   *
   * Para cualquier array de ratings, cuando se abre el modal para un tmdbId que
   * tiene rating, debe pre-cargarse el valor y comentario correctos.
   *
   * EXPECTED: PASA en código sin corregir
   */
  it('Preservation 4 — handleOpenRatingModal pre-carga ratingValue y comment del rating existente', () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (items) => {
        const uniqueItems = Array.from(
          new Map(items.map(r => [r.tmdbId, r])).values()
        );

        // Para cada rating existente, el modal debe pre-cargarlo correctamente
        return uniqueItems.every(existingRating => {
          const preloaded = preloadRatingModal(uniqueItems, existingRating.tmdbId);
          return (
            preloaded.ratingValue === existingRating.rating &&
            preloaded.comment === (existingRating.comment || '')
          );
        });
      }),
      { verbose: true, numRuns: 100 }
    );
  });

  /**
   * Preservation 4b: handleOpenRatingModal devuelve valores vacíos para tmdbId sin rating
   *
   * Para un tmdbId que no tiene rating, el modal debe inicializarse con valores vacíos.
   *
   * EXPECTED: PASA en código sin corregir
   */
  it('Preservation 4b — handleOpenRatingModal devuelve valores vacíos para ítem sin rating', () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (items) => {
        // tmdbId que no existe en ratings
        const nonExistentTmdbId = 9999999;

        const preloaded = preloadRatingModal(items, nonExistentTmdbId);

        return preloaded.ratingValue === 0 && preloaded.comment === '';
      }),
      { verbose: true, numRuns: 100 }
    );
  });

  /**
   * Preservation 5: handleDeleteRating filtra el array local correctamente
   *
   * Para cualquier array de ratings, eliminar un rating por tmdbId debe
   * producir un array sin ese elemento y con todos los demás intactos.
   *
   * EXPECTED: PASA en código sin corregir
   */
  it('Preservation 5 — handleDeleteRating filtra el array local correctamente', () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (items) => {
        const uniqueItems = Array.from(
          new Map(items.map(r => [r.tmdbId, r])).values()
        );

        if (uniqueItems.length === 0) return true;

        // Elegir el primer item para eliminar
        const toDelete = uniqueItems[0];
        const filtered = filterRatingsAfterDelete(uniqueItems, toDelete.tmdbId);

        // El item eliminado no debe estar en el resultado
        const deletedGone = !filtered.some(r => r.tmdbId === toDelete.tmdbId);

        // El resto de items debe permanecer intacto
        const othersPreserved = uniqueItems
          .slice(1)
          .every(r => filtered.some(f => f.tmdbId === r.tmdbId && f.rating === r.rating));

        // El tamaño debe reducirse en exactamente 1
        const sizeCorrect = filtered.length === uniqueItems.length - 1;

        return deletedGone && othersPreserved && sizeCorrect;
      }),
      { verbose: true, numRuns: 100 }
    );
  });

  /**
   * Preservation 6: Comportamiento idéntico antes y después del fix
   *
   * Para cualquier array de RatingItem en estructura { ratings: { items: [...] } },
   * el resultado de parseRatingsOriginal debe ser idéntico al resultado del fix
   * (que también maneja esta estructura como primer caso del fallback).
   *
   * EXPECTED: PASA en código sin corregir (y también tras el fix)
   */
  it('Preservation 6 — resultado idéntico entre código original y código corregido para estructura conocida', () => {
    fc.assert(
      fc.property(nonEmptyRatingsArb, (items) => {
        const responseData = { ratings: { items } };

        // Comportamiento original (sin corregir)
        const originalResult = parseRatingsOriginal(responseData);

        // Comportamiento del fix (fallback robusto — mismo resultado para esta estructura)
        const data = responseData as any;
        const fixedResult: RatingItem[] =
          data?.ratings?.items ||
          data?.ratings ||
          data?.items ||
          data ||
          [];

        // Ambos deben producir el mismo resultado
        return (
          originalResult.length === fixedResult.length &&
          originalResult.every((r, i) =>
            r.tmdbId === fixedResult[i].tmdbId &&
            r.rating === fixedResult[i].rating
          )
        );
      }),
      { verbose: true, numRuns: 100 }
    );
  });
});
