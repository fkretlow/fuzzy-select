class FuzzyRegExp {
    constructor(q) {
        this.query = q;
        this.buildRegExp();
    }

    buildRegExp() {
        let chars = this.query.split("");
        chars.forEach((c, i, A) => { if (c == ".") A[i] = "\\."; });
        let tokens = [ "(?<skipHead>.*)" ];
        chars.forEach((c, i) => {
            tokens.push(`(?<match${i}>${c})`);
            if (i < chars.length - 1) tokens.push(`(?<skip${i}>.*)`);
        });
        tokens.push("(?<skipTail>.*)");
        this.re = new RegExp(tokens.join(""), "i");
    }

    fuzzyMatch(s) {
        let ret = { };
        let m = this.re.exec(s);
        if (!m) {
            ret.match = false;
        } else {
            ret.match = true;
            ret.groups = [];
            let i = 0;
            for (let k in m.groups) {
                if (k.startsWith("skip")) {
                    if (m.groups[k]) ret.groups.push({
                        match: false,
                        start: i,
                        end: i + m.groups[k].length,
                        value: m.groups[k]
                    });
                } else {
                    if (ret.groups.length > 0 && ret.groups[ret.groups.length-1].match) {
                        ret.groups[ret.groups.length-1].value = ret.groups[ret.groups.length-1].value.concat(m.groups[k]);
                        ret.groups[ret.groups.length-1].end += m.groups[k].length;
                    } else {
                        ret.groups.push({
                            match: true,
                            start: i,
                            end: i + m.groups[k].length,
                            value: m.groups[k]
                        });
                    }
                }
                i += m.groups[k].length;
            }
            ret.coherent = ret.groups.reduce((acc, cur) => cur.match ? ++acc : acc, 0) === 1
                ? true : false;
        }
        return ret;
    }

    exec(s) { return this.re.exec(s); }
    test(s) { return this.re.test(s); }
}


class FuzzySelectHandler {
    constructor(input, output, catalog) {
        this.input = input;
        this.input.addEventListener("input", e => {
            this.fuzzyFind(e.target.value);
        });

        this.output = output;
        this.catalog = catalog;
    }

    fuzzyFind(query) {
        let re = new FuzzyRegExp(query);

        this.output.textContent = "";

        let coherentMatches = [];
        let otherMatches = [];

        for (const item of catalog) {
            /* TODO: matches that contain the user query in one piece should always appear at the
             * top of the list. */
            const m = re.fuzzyMatch(item);
            if (m.match) {
                let li = document.createElement("li");
                for (const group of m.groups) {
                    let span = document.createElement("span");
                    if (group.match) {
                        span.setAttribute("class", "fuzzy-select-inline-match");
                    }
                    span.textContent = group.value;
                    li.appendChild(span);
                }
                console.log(`m.coherent: ${m.coherent}`);
                if (m.coherent) coherentMatches.push(li);
                else            otherMatches.push(li);
            }
            for (const li of coherentMatches) {
                this.output.appendChild(li);
            }
            for (const li of otherMatches) {
                this.output.appendChild(li);
            }
        }
    }
}
