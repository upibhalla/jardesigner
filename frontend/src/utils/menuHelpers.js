{
type: "file",
fileName: "src/utils/menuHelpers.js",
fullContent: `
/**
 * Constant for the "User specified" menu option.
 * Import this in MenuBoxes to check if this option was selected.
 */
export const OPTION_USER_SPECIFIED = "User specified path";

/**
 * Generates a list of menu options for compartments based on available simulation paths.
 * * Logic:
 * 1. Always includes specific priority items (soma, dend0/1, basal0/1, head0/1) if present.
 * 2. If list size <= 10, includes all paths (deduplicated).
 * 3. Adds wildcards (dend#, basal#, head#) if multiple entries exist for those prefixes.
 * 4. Always appends a "User specified path" option.
 * * @param {string[]} simPaths - List of full simulation paths (e.g. ["/model/soma", "/model/dend[0]"])
 * @returns {string[]} - Array of strings to be used in a Dropdown/Select menu.
 */
export const getCompartmentOptions = (simPaths = []) => {
    if (!simPaths || !Array.isArray(simPaths)) {
        return [OPTION_USER_SPECIFIED];
    }

    // Helper to clean paths if necessary (currently assumes simPaths are just the names or full paths)
    // If simPaths are like "/model/soma", we might want to extract just "soma" for display/logic?
    // Assuming for now the logic applies to the string as-is or the "name" part.
    // Let's assume the input strings are the values we check against.
    
    const options = new Set();
    const sortedPaths = [...simPaths].sort();

    // 1. Priority Checks
    const priorityTargets = [
        "soma", 
        "dend", "dend0", "dend1", 
        "basal", "basal0", "basal1", 
        "head", "head0", "head1"
    ];

    priorityTargets.forEach(target => {
        // Check if exact match exists in simPaths (or maybe ends with it?)
        // Assuming strict match or check if the path ends with /target or [target]
        // Adjusting logic: The prompt implies these are distinct entries. 
        // We will look for partial matches if full paths are provided, or exact if names.
        
        const found = sortedPaths.find(p => p.endsWith(target) || p.endsWith(\`/\${target}\`) || p === target);
        if (found) {
            options.add(found);
        }
    });

    // 2. Wildcards
    const countPrefix = (prefix) => sortedPaths.filter(p => p.includes(prefix)).length;

    if (countPrefix("dend") > 1) options.add("dend#");
    if (countPrefix("basal") > 1) options.add("basal#");
    if (countPrefix("head") > 1) options.add("head#");

    // 3. Small List Condition (<= 10)
    if (sortedPaths.length <= 10) {
        sortedPaths.forEach(p => options.add(p));
    }

    // Convert to array
    const finalOptions = Array.from(options);

    // 4. Always add User Specified
    finalOptions.push(OPTION_USER_SPECIFIED);

    return finalOptions;
};
`
}
