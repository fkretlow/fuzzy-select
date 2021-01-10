class FuzzyRegExp {
    constructor(query) {
        this.query = query;
        this.exactRe = FuzzyRegExp.buildExactRe(query);
        this.multiRe = FuzzyRegExp.buildMultiRe(query);
        this.fuzzyRe = FuzzyRegExp.buildFuzzyRe(query);
    }

    static buildExactRe(query) {
        let escaped = query.replace(".", "\\.");
        return new RegExp( `(?<skipHead>.*)(?<match>${escaped})(?<skipTail>.*)`, "i");
    }

    static buildMultiRe(query) {
        if (!query.includes(" ")) return null;
        let words = query.replace(".", "\\.").split(" ");
        let tokens = [ "(?<skipHead>.*)" ];
        for (let i = 0; i < words.length; ++i) {
            tokens.push(`(?<match${i}>${words[i]})`);
            if (i < words.length - 1) tokens.push(`(?<skip${i}>.*)`);
        }
        tokens.push("(?<skipTail>.*)");
        return new RegExp(tokens.join(""), "i");
    }

    static buildFuzzyRe(query) {
        let chars = query.split("");
        chars.forEach((c, i, A) => { if (c == ".") A[i] = "\\."; });
        let tokens = [ "(?<skipHead>.*)" ];
        for (let i = 0; i < chars.length; ++i) {
            tokens.push(`(?<match${i}>${chars[i]})`);
            if (i < chars.length - 1) tokens.push(`(?<skip${i}>.*)`);
        }
        tokens.push("(?<skipTail>.*)");
        return new RegExp(tokens.join(""), "i");
    }

    exec(s) {
        let ret = { };

        let m = this.exactRe.exec(s);
        if (m) ret.type = "exact";

        if (!m && this.multiRe) {
            m = this.multiRe.exec(s);
            if (m) ret.type = "multi";
        }

        if (!m) {
            m = this.fuzzyRe.exec(s);
            if (m) ret.type = "fuzzy";
            else { ret.match = false; return ret; }
        }

        ret.match = true;
        ret.groups = [];
        let i = 0;
        for (let k in m.groups) {
            let group = m.groups[k];
            if (k.startsWith("skip")) {
                if (group) ret.groups.push({
                    match: false,
                    start: i,
                    end: i + group.length,
                    value: group
                });
            } else {
                if (ret.groups.length > 0 && ret.groups[ret.groups.length-1].match) {
                    ret.groups[ret.groups.length-1].value = ret.groups[ret.groups.length-1].value.concat(group);
                    ret.groups[ret.groups.length-1].end += group.length;
                } else {
                    ret.groups.push({
                        match: true,
                        start: i,
                        end: i + group.length,
                        value: group
                    });
                }
            }
            i += group.length;
        }

        if (ret.groups.reduce((acc, cur) => cur.match ? ++acc : acc, 0) === 1) {
            ret.type = "exact";
        }
        return ret;
    }
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
