function gridCandidate(availableWidth, availableHeight, cardWidth, cardHeight, gap, cutOffset, rotation) {
  const effectiveWidth = cardWidth + cutOffset * 2;
  const effectiveHeight = cardHeight + cutOffset * 2;
  const countX = Math.max(0, Math.floor((availableWidth + gap) / (effectiveWidth + gap)));
  const countY = Math.max(0, Math.floor((availableHeight + gap) / (effectiveHeight + gap)));
  return { countX, countY, capacity: countX * countY, cardWidth, cardHeight, effectiveWidth, effectiveHeight, rotation };
}

function usedFootprint(count, candidate, gap) {
  if (!count || !candidate.countX) return { usedWidthMm: 0, usedHeightMm: 0 };
  const rowsUsed = Math.ceil(count / candidate.countX);
  const columnsUsed = Math.min(count, candidate.countX);
  return {
    usedWidthMm: columnsUsed * candidate.effectiveWidth + Math.max(0, columnsUsed - 1) * gap,
    usedHeightMm: rowsUsed * candidate.effectiveHeight + Math.max(0, rowsUsed - 1) * gap,
  };
}

export function calculateBestOrientation({ paperWidthMm, paperHeightMm, cardWidthMm, cardHeightMm, marginMm = 5, gapMm = 5, cutLineOffsetMm = 0, quantity = 1, allowRotation = true }) {
  const availableWidth = paperWidthMm - marginMm * 2;
  const availableHeight = paperHeightMm - marginMm * 2;
  const requested = quantity === 'fill' ? Infinity : Math.max(1, Math.floor(Number(quantity) || 1));
  const normal = gridCandidate(availableWidth, availableHeight, cardWidthMm, cardHeightMm, gapMm, cutLineOffsetMm, 0);
  const rotated = gridCandidate(availableWidth, availableHeight, cardHeightMm, cardWidthMm, gapMm, cutLineOffsetMm, 90);
  const candidates = allowRotation && cardWidthMm !== cardHeightMm ? [normal, rotated] : [normal];
  const ranked = candidates.map((candidate) => {
    const served = Math.min(candidate.capacity, requested);
    const footprint = usedFootprint(served, candidate, gapMm);
    return { ...candidate, ...footprint, served, wastedAreaMm2: availableWidth * availableHeight - footprint.usedWidthMm * footprint.usedHeightMm };
  });
  ranked.sort((a, b) => b.served - a.served || a.wastedAreaMm2 - b.wastedAreaMm2 || a.rotation - b.rotation);
  const best = ranked[0];
  return { orientation: best.rotation ? 'landscape' : 'portrait', rotation: best.rotation, itemsPerPage: best.capacity, countX: best.countX, countY: best.countY, usedWidthMm: best.usedWidthMm, usedHeightMm: best.usedHeightMm, wastedAreaMm2: best.wastedAreaMm2, candidate: best };
}

function positionsForPage(count, grid, paperWidth, paperHeight, gap, cutOffset) {
  if (!count) return [];
  const rowsUsed = Math.ceil(count / grid.countX);
  const groupHeight = rowsUsed * grid.effectiveHeight + Math.max(0, rowsUsed - 1) * gap;
  const startY = (paperHeight - groupHeight) / 2;
  const positions = [];
  for (let row = 0; row < rowsUsed; row += 1) {
    const remaining = count - positions.length;
    const itemsInRow = Math.min(grid.countX, remaining);
    const rowWidth = itemsInRow * grid.effectiveWidth + Math.max(0, itemsInRow - 1) * gap;
    const startX = (paperWidth - rowWidth) / 2;
    for (let column = 0; column < itemsInRow; column += 1) {
      positions.push({
        xMm: startX + cutOffset + column * (grid.effectiveWidth + gap), yMm: startY + cutOffset + row * (grid.effectiveHeight + gap),
        widthMm: grid.cardWidth, heightMm: grid.cardHeight, rotation: grid.rotation,
        cutLineXmm: startX + column * (grid.effectiveWidth + gap), cutLineYmm: startY + row * (grid.effectiveHeight + gap),
        cutLineWidthMm: grid.effectiveWidth, cutLineHeightMm: grid.effectiveHeight,
      });
    }
  }
  return positions;
}

export function calculateA4Layout({ paperWidthMm = 210, paperHeightMm = 297, cardWidthMm, cardHeightMm, marginMm = 5, gapMm = 5, quantity = 1, allowRotation = true, cutLineOffsetMm = 0 }) {
  const decision = calculateBestOrientation({ paperWidthMm, paperHeightMm, cardWidthMm, cardHeightMm, marginMm, gapMm, cutLineOffsetMm, quantity, allowRotation });
  const best = decision.candidate;
  if (best.capacity < 1) return { ...decision, pageCount: 0, quantity: 0, orientationUsed: best.rotation ? 'rotated' : 'normal', positions: [], pages: [] };
  const requestedQuantity = quantity === 'fill' ? best.capacity : Math.max(1, Math.floor(Number(quantity) || 1));
  const pageCount = Math.ceil(requestedQuantity / best.capacity);
  const pages = Array.from({ length: pageCount }, (_, pageIndex) => {
    const count = Math.min(best.capacity, requestedQuantity - pageIndex * best.capacity);
    return { pageNumber: pageIndex + 1, count, positions: positionsForPage(count, best, paperWidthMm, paperHeightMm, gapMm, cutLineOffsetMm) };
  });
  return { ...decision, pageCount, quantity: requestedQuantity, orientationUsed: best.rotation ? 'rotated' : 'normal', columns: best.countX, rows: best.countY, positions: pages[0].positions, pages };
}

export function calculateLayoutFromPrintSettings(settings, paper = { widthMm: 210, heightMm: 297 }) {
  let widthMm = settings.cardWidthMm;
  let heightMm = settings.cardHeightMm;
  const automatic = settings.orientation === 'auto';
  if (settings.orientation === 'portrait') [widthMm, heightMm] = [Math.min(widthMm, heightMm), Math.max(widthMm, heightMm)];
  if (settings.orientation === 'landscape') [widthMm, heightMm] = [Math.max(widthMm, heightMm), Math.min(widthMm, heightMm)];
  const fullPage = (widthMm === paper.widthMm && heightMm === paper.heightMm) || (widthMm === paper.heightMm && heightMm === paper.widthMm);
  const cutLineOffsetMm = !fullPage && settings.cutLineSettings?.enabled ? settings.cutLineSettings.offsetMm : 0;
  const result = calculateA4Layout({ paperWidthMm: paper.widthMm, paperHeightMm: paper.heightMm, cardWidthMm: widthMm, cardHeightMm: heightMm, marginMm: fullPage ? 0 : settings.marginMm, gapMm: settings.gapMm, quantity: settings.quantityMode === 'fill' ? 'fill' : settings.quantity, allowRotation: automatic, cutLineOffsetMm });
  return { ...result, fullPage };
}
