/**
 * Formats a floating-point number into its nearest compact string representation.
 */
export const formatFloat = (num) => {
    if (num == null) return '';
    const preciseNum = parseFloat(Number(num).toPrecision(15));
    return String(preciseNum);
};

// You can add other formatting functions here in the future.
