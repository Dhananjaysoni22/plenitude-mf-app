export const normalizeFundName = (name: string): string => {
    let n = name.toLowerCase();
    
    // Replace common variations
    n = n.replace(/smallcap/g, 'small cap');
    n = n.replace(/midcap/g, 'mid cap');
    n = n.replace(/largecap/g, 'large cap');
    n = n.replace(/flexicap/g, 'flexi cap');
    n = n.replace(/multicap/g, 'multi cap');
    n = n.replace(/microcap/g, 'micro cap');
    
    // Remove punctuation
    n = n.replace(/[^a-z0-9\s]/g, ' ');
    
    // Remove stop words
    const stopWords = ['fund', 'plan', 'reg', 'regular', 'dir', 'direct', 'growth', 'g', 'd', 'div', 'dividend', 'idcw', 'reinvestment', 'payout', 'option'];
    let words = n.split(/\s+/);
    words = words.filter(w => !stopWords.includes(w) && w.length > 0);
    
    return words.join(' ');
};

export const diceCoefficient = (str1: string, str2: string): number => {
    const rawWords1 = str1.trim().toLowerCase().split(/[\s-]+/);
    const rawWords2 = str2.trim().toLowerCase().split(/[\s-]+/);
    
    const norm1 = normalizeFundName(str1);
    const norm2 = normalizeFundName(str2);

    const s1 = norm1.replace(/\s+/g, '');
    const s2 = norm2.replace(/\s+/g, '');

    if (s1 === s2) return 1;
    if (s1.length < 2 || s2.length < 2) return 0;

    let bigrams1 = new Map<string, number>();
    for (let i = 0; i < s1.length - 1; i++) {
        const bigram = s1.substring(i, i + 2);
        const count = bigrams1.has(bigram) ? bigrams1.get(bigram)! + 1 : 1;
        bigrams1.set(bigram, count);
    }

    let intersectionSize = 0;
    for (let i = 0; i < s2.length - 1; i++) {
        const bigram = s2.substring(i, i + 2);
        const count = bigrams1.has(bigram) ? bigrams1.get(bigram)! : 0;

        if (count > 0) {
            bigrams1.set(bigram, count - 1);
            intersectionSize++;
        }
    }

    let score = (2.0 * intersectionSize) / (s1.length - 1 + s2.length - 1);

    // AMC Match Penalty
    if (rawWords1.length > 0 && rawWords2.length > 0) {
        const w1 = rawWords1[0].replace(/[^a-z0-9]/g, '');
        const w2 = rawWords2[0].replace(/[^a-z0-9]/g, '');
        if (w1 && w2 && w1 !== w2 && !w1.includes(w2) && !w2.includes(w1)) {
            score *= 0.1; // Slash score by 90% if AMCs definitely don't match
        }
    }

    return score;
};
