class FuzzyRegExp {
    constructor(q) {
        this.query = q;
        this.buildRegExp();
        this.buildFuzzyRegExp();
    }

    buildRegExp() {
        let escaped = this.query.replace(".", "\\.");
        this.re = new RegExp( `(?<skipHead>.*)(?<match>${escaped})(?<skipTail>.*)`, "i");
    }

    buildFuzzyRegExp() {
        let chars = this.query.split("");
        chars.forEach((c, i, A) => { if (c == ".") A[i] = "\\."; });
        let tokens = [ "(?<skipHead>.*)" ];
        chars.forEach((c, i) => {
            tokens.push(`(?<match${i}>${c})`);
            if (i < chars.length - 1) tokens.push(`(?<skip${i}>.*)`);
        });
        tokens.push("(?<skipTail>.*)");
        this.fuzzyRe = new RegExp(tokens.join(""), "i");
    }

    exactMatch(s) {
        let ret = { };
        let m = this.re.exec(s);
        if (!m) ret.match = false;
        else {
            ret.match = true;
            ret.coherent = true;
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
                    ret.groups.push({
                        match: true,
                        start: i,
                        end: i + m.groups[k].length,
                        value: m.groups[k]
                    });
                }
                i += m.groups[k].length;
            }
        }
        return ret;
    }

    fuzzyMatch(s) {
        let ret = { };
        let m = this.re.exec(s);
        if (!m) m = this.fuzzyRe.exec(s);
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


class FuzzySelect {
    constructor(inputElement, outputElement, data, sieve, placeholder) {
        this.input = inputElement;
        this.input.setAttribute("placeholder", placeholder);

        // initialize list of matches
        this.output = outputElement;
        this.data = data;

        /* sieve must be a function that generates a list of DOM list elements from the data
         * attached to the select box and the current user query. */
        this.sieve = sieve;

        this.highlighted = null;

        // each time the input changes, refresh list of matches
        this.input.addEventListener("input", e => { this.update(); });

        // when we get focus, update the list of matches
        this.input.addEventListener("focusin", e => {
            this.appendOutput(this.data);
            for (const li of this.output.children) {
                if (li.textContent === this.input.value) {
                    this.highlight(li);
                    break;
                }
            }
            this.input.value = "";
            this.output.classList.toggle("fuzzy-select-shown");
        });

        // when we lose focus, only keep valid inputs
        this.input.addEventListener("focusout", e => {
            if (this.highlighted) {
                this.input.value = this.highlighted.textContent;
            } else {
                this.input.value = "";
            }
            this.clearOutput();
            this.output.classList.toggle("fuzzy-select-shown");
        });

        // handle special keys
        this.input.addEventListener("keyup", e => {
            switch (e.code) {
                case "ArrowDown":
                    this.highlightNext();
                    break;
                case "ArrowUp":
                    this.highlightPrevious();
                    break;
                case "Enter":
                    this.confirm();
            }
        });
    }

    update() {
        this.clearOutput();
        for (const li of this.sieve(this.data, this.input.value)) {
            li.addEventListener("mouseenter", e => {
                this.highlight(e.target);
            });
            this.output.appendChild(li);
        }
    }

    confirm() {
        if (this.highlighted) {
            this.input.value = this.highlighted.textContent;
            this.input.blur();
        }
    }

    highlight(li) {
        if (this.highlighted) {
            this.highlighted.classList.toggle("fuzzy-select-highlight");
        }
        if (li) {
            this.highlighted = li;
            this.highlighted.classList.toggle("fuzzy-select-highlight");
        } else {
            this.highlighted = null;
        }
    }

    highlightFirst() {
        this.highlight(this.output.firstChild);
    }

    highlightNext() {
        if (this.highlighted) {
            this.highlight(this.highlighted.nextSibling || this.output.firstChild);
        } else {
            this.highlight(this.output.firstChild);
        }
    }

    highlightPrevious() {
        this.highlight(this.highlighted.previousSibling || this.output.lastChild);
    }

    clearOutput() {
        this.output.textContent = "";
    }

    appendOutput(items) {
        for (const item of items) {
            let li;
            if (typeof(item) === "string") {
                li = document.createElement("li");
                li.textContent = item;
            } else {
                li = item;
            }
            li.addEventListener("mouseenter", e => {
                this.highlight(e.target);
            });
            this.output.appendChild(li);
        }
    }
}
