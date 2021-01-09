function* fuzzySieve(data, query) {
    re = new FuzzyRegExp(query);
    let matched = new Set();

    // yield exact matches first
    for (const item of data) {
        const m = re.exactMatch(item);
        if (m.match) {
            matched.add(item);
            let li = document.createElement("li");
            for (const group of m.groups) {
                let span = document.createElement("span");
                if (group.match) {
                    span.setAttribute("class", "fuzzy-select-inline-match");
                }
                span.textContent = group.value;
                li.appendChild(span);
            }
            yield li;
        }
    }

    if (matched.size > 2) return;

    // and then match the rest "fuzzily"
    for (const item of data) {
        if (matched.has(item)) continue;
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
            yield li;
        }
    }
}

let processes = new Set();

window.addEventListener("load", e => {
    ajaxUtils.makeAjaxCall(
        "https://oekobilanz.fkretlow.vercel.app/api?query=processes:format=json", "GET", true
    ).then(json => {
        json.data.forEach(item => {
            processes.add(item.name);
        });
    });
    const input = document.querySelector("#select-input");
    const output = document.querySelector("#select-output");
    const handler = new FuzzySelect(input, output, processes, fuzzySieve, "select process");
});
