class FuzzyRegex {
    constructor(query) {
        this.query = query;
        this.exactRegex = FuzzyRegex.buildExactRegex(query);
        this.multiRegex = FuzzyRegex.buildMultiRegex(query);
        this.fuzzyRegex = FuzzyRegex.buildFuzzyRegex(query);
    }

    static buildExactRegex(query) {
        let escaped = query.replace(".", "\\.");
        return new RegExp( `(?<skipHead>.*?)(?<match>${escaped})(?<skipTail>.*)`, "i");
    }

    static buildMultiRegex(query) {
        if (!query.includes(" ")) return null;
        let words = query.replace(".", "\\.").split(" ");
        let tokens = [ "(?<skipHead>.*?)" ];
        for (let i = 0; i < words.length; ++i) {
            tokens.push(`(?<match${i}>${words[i]})`);
            if (i < words.length - 1) tokens.push(`(?<skip${i}>.*?)`);
        }
        tokens.push("(?<skipTail>.*)");
        return new RegExp(tokens.join(""), "i");
    }

    static buildFuzzyRegex(query) {
        let chars = query.split("");
        chars.forEach((c, i, A) => { if (c == ".") A[i] = "\\."; });
        let tokens = [ "(?<skipHead>.*?)" ];
        for (let i = 0; i < chars.length; ++i) {
            tokens.push(`(?<match${i}>${chars[i]})`);
            if (i < chars.length - 1) tokens.push(`(?<skip${i}>.*?)`);
        }
        tokens.push("(?<skipTail>.*)");
        return new RegExp(tokens.join(""), "i");
    }

    exec(s) {
        let matchType;
        let groups;

        let result = this.exactRegex.exec(s);
        if (result) matchType = "exact";

        if (!result && this.multiRegex) {
            result = this.multiRegex.exec(s);
            if (result) matchType = "multi";
        }

        if (!result) {
            result = this.fuzzyRegex.exec(s);
            if (result) matchType = "fuzzy";
            else return null;
        }

        groups = [];
        let i = 0;
        for (let k in result.groups) {
            let group = result.groups[k];
            if (k.startsWith("skip")) {
                if (group) groups.push({
                    match: false,
                    start: i,
                    value: group
                });
            } else {
                if (groups.length > 0 && groups[groups.length-1].match) {
                    groups[groups.length-1].value = groups[groups.length-1].value.concat(group);
                    groups[groups.length-1].end += group.length;
                } else {
                    groups.push({
                        match: true,
                        start: i,
                        value: group
                    });
                }
            }
            i += group.length;
        }

        return new FuzzyRegexMatch(matchType, groups);
    }
}

class FuzzyRegexMatch {
    constructor(matchType, groups) {
        this.matchType = matchType;
        this.groups = groups;
    }

    *matchedGroups() {
        for (const group of this.groups) {
            if (group.match) yield group;
        }
    }

    matchedGroupCount() {
        let count = 0;
        for (const group of this.matchedGroups()) ++count;
        return count;
    }

    averageMatchedGroupLength() {
        let totalLength = 0;
        let count = 0;
        for (const group of this.matchedGroups()) {
            totalLength += group.value.length;
            ++count;
        }
        return totalLength / count;
    }
}
