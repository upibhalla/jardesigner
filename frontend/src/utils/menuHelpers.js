/**
 * Constant for the "User specified" menu option.
 * Import this in MenuBoxes to check if this option was selected.
 */
export const OPTION_USER_SPECIFIED = "User specified path";

const MATH_FNS = {
    H: x => x >= 0 ? 1 : 0,
    sign: Math.sign,
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    exp: Math.exp, log: Math.log, sqrt: Math.sqrt,
    abs: Math.abs, floor: Math.floor, ceil: Math.ceil,
};

// Spatial variables for rdesigneur distribution expressions.
const DISTRIB_EXPR_SCOPE = {
    p: 5e-4, g: 5e-4, L: 1.0, len: 1e-4, dia: 1e-5,
    maxP: 1e-3, maxG: 1e-3, maxL: 5.0,
    ...MATH_FNS,
};

// Stimulus expressions use only t (time in seconds).
const STIM_EXPR_SCOPE = {
    t: 0.15,
    ...MATH_FNS,
};

const _runExpr = (expr, scope) => {
    if (!expr || expr.trim() === '') return null;
    if (!isNaN(Number(expr))) return null;
    const jsExpr = expr.replace(/\^/g, '**'); // muParser uses ^ for power
    try {
        const fn = new Function(...Object.keys(scope), `return (${jsExpr})`);
        fn(...Object.values(scope));
        return null;
    } catch (e) {
        return e.message;
    }
};

/**
 * Validate a muParser distribution expression (p, g, L, len, dia, maxP, maxG, maxL).
 * Returns null if valid, or an error message string if invalid.
 */
export const validateExpr = (expr) => _runExpr(expr, DISTRIB_EXPR_SCOPE);

/**
 * Validate a muParser stimulus expression (t = time in seconds only).
 * Returns null if valid, or an error message string if invalid.
 */
export const validateStimExpr = (expr) => _runExpr(expr, STIM_EXPR_SCOPE);

const GEOM_VARS_REGEX = /\b(p|g|L|len|dia|maxP|maxG|maxL)\b/;

/**
 * Warn when a geometry expression is used but the morphology has only 1 segment per branch.
 * With a single segment, all geometry variables (p, g, L, len, dia…) have the same value in
 * every compartment, so the expression provides no spatial variation — equivalent to a constant.
 * Only fires for parametric morphologies (ballAndStick / branchedCell) with dendNumSeg === 1.
 * Returns null if no warning is needed, or a warning string.
 */
export const warnSingleSegExpr = (expr, cellProto) => {
    if (!expr || !isNaN(Number(expr))) return null; // plain number — skip
    if (!cellProto) return null;
    const { type, dendNumSeg } = cellProto;
    if (type !== 'ballAndStick' && type !== 'branchedCell') return null;
    if (!dendNumSeg || dendNumSeg > 1) return null;
    if (GEOM_VARS_REGEX.test(expr))
        return 'Geometry expression with 1 segment per branch — all compartments share the same value; increase segments in Morphology';
    return null;
};

/**
 * Generates a list of menu options for compartments based on available simulation paths.
 *
 * Ordering:
 *   1. soma (if present) — always first
 *   2. base# wildcards — for any base name with multiple numeric-suffix entries
 *      (e.g. head0, head1, head2 → head#), sorted alphabetically
 *   3. Individual paths — up to 10, sorted, excluding shaft compartments
 *   4. "User specified path" — always last
 *
 * @param {string[]} simPaths - List of simulation paths (e.g. ["soma", "dend0", "head0"])
 * @returns {string[]} - Array of strings for use in a Dropdown/Select menu.
 */
export const getCompartmentOptions = (simPaths = []) => {
    if (!simPaths || !Array.isArray(simPaths)) {
        return [OPTION_USER_SPECIFIED];
    }

    // Filter shafts — internal spine connectors, not useful as stim/plot targets
    const filtered = simPaths.filter(p => !p.includes('shaft'));
    // Natural sort so head2 comes before head10
    const sortedPaths = [...filtered].sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    const result = [];
    const seen = new Set();

    // 1. soma first
    const soma = sortedPaths.find(p => p === 'soma' || p.endsWith('/soma'));
    if (soma) { result.push(soma); seen.add(soma); }

    // 1b. All-compartments wildcard (only if not already in simPaths)
    if (!sortedPaths.includes('#')) result.push('#');
    seen.add('#');

    // 2. Wildcards — sorted so the order is deterministic
    const baseCounts = {};
    sortedPaths.forEach(p => {
        const m = p.match(/^([a-zA-Z_]+)\d+$/);
        if (m) baseCounts[m[1]] = (baseCounts[m[1]] || 0) + 1;
    });
    Object.keys(baseCounts).sort().forEach(base => {
        if (baseCounts[base] > 1) result.push(base + '#');
    });

    // 3. Individual paths up to a cap of 10
    let added = 0;
    for (const p of sortedPaths) {
        if (added >= 10) break;
        if (!seen.has(p)) { result.push(p); seen.add(p); added++; }
    }

    // 4. User specified last
    result.push(OPTION_USER_SPECIFIED);
    return result;
};
